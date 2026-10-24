import { api } from '@/lib/api-client'
import type { LoginRequest, RegisterRequest, SessionResponse } from '@/contracts/api'

export async function loginRequest(body: LoginRequest): Promise<SessionResponse> {
  const { data } = await api.post<SessionResponse>('/auth/login', body)
  return data
}

export async function registerRequest(body: RegisterRequest): Promise<SessionResponse> {
  const { data } = await api.post<SessionResponse>('/auth/register', body)
  return data
}

export async function fetchSession(): Promise<SessionResponse> {
  const { data } = await api.get<SessionResponse>('/auth/session')
  return data
}

export async function logoutRequest(): Promise<void> {
  await api.post('/auth/logout')
}