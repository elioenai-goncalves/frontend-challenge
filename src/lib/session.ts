import { useSyncExternalStore } from 'react'
import { AxiosError } from 'axios'
import type { SessionResponse, User } from '@/contracts/api'
import { setApiAccessToken } from '@/lib/api-client'
import { fetchSession, logoutRequest } from '@/lib/auth-api'
import { queryClient } from '@/lib/query-client'

const STORAGE_KEY = 'frontend-challenge:session'

export type SessionState =
  | { status: 'anonymous'; user: null }
  | { status: 'authenticated'; user: User; expiresAt: string }

interface StoredSession {
  accessToken: string
  expiresAt: string
}

const ANONYMOUS: SessionState = { status: 'anonymous', user: null }

let state: SessionState = ANONYMOUS
let initPromise: Promise<void> | null = null
const listeners = new Set<() => void>()
const endCallbacks = new Set<() => void>()

function setState(next: SessionState): void {
  state = next
  listeners.forEach((listener) => listener())
}

function readStored(): StoredSession | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<StoredSession>
    if (typeof parsed.accessToken === 'string' && typeof parsed.expiresAt === 'string') {
      return { accessToken: parsed.accessToken, expiresAt: parsed.expiresAt }
    }
  } catch {
    // conteúdo inválido: trata como sem sessão
  }
  return null
}

function writeStored(session: StoredSession): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(session))
}

function clearStored(): void {
  localStorage.removeItem(STORAGE_KEY)
}

export function getSession(): SessionState {
  return state
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function useSession(): SessionState {
  return useSyncExternalStore(subscribe, getSession, getSession)
}

// Permite que outras camadas (ex.: Socket.IO) encerrem recursos da sessão.
export function onSessionEnd(callback: () => void): () => void {
  endCallbacks.add(callback)
  return () => {
    endCallbacks.delete(callback)
  }
}

function resetPrivateData(): void {
  endCallbacks.forEach((callback) => callback())
  queryClient.clear()
}

export function startSession(data: SessionResponse): void {
  resetPrivateData()
  writeStored({ accessToken: data.accessToken, expiresAt: data.expiresAt })
  setApiAccessToken(data.accessToken)
  setState({ status: 'authenticated', user: data.user, expiresAt: data.expiresAt })
}

export function endSession(): void {
  clearStored()
  setApiAccessToken(null)
  resetPrivateData()
  setState(ANONYMOUS)
}

export async function logout(): Promise<void> {
  try {
    await logoutRequest()
  } catch {
    // a sessão local é encerrada mesmo sem resposta do servidor
  }
  endSession()
}

async function restoreSession(): Promise<void> {
  const stored = readStored()
  if (!stored) return

  if (new Date(stored.expiresAt).getTime() <= Date.now()) {
    clearStored()
    return
  }

  setApiAccessToken(stored.accessToken)

  try {
    const data = await fetchSession()
    writeStored({ accessToken: stored.accessToken, expiresAt: data.expiresAt })
    setState({ status: 'authenticated', user: data.user, expiresAt: data.expiresAt })
  } catch (error) {
    setApiAccessToken(null)
    if (error instanceof AxiosError && error.response?.status === 401) {
      clearStored()
    }
  }
}

export function initSession(): Promise<void> {
  initPromise ??= restoreSession()
  return initPromise
}