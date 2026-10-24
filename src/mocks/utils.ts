import { HttpResponse } from 'msw/http'
import type { ApiErrorCode, ApiErrorResponse } from '@/contracts/api'
import { db, type StoredUser } from './db'

export function errorResponse(
  status: number,
  code: ApiErrorCode,
  message: string,
  fieldErrors?: Record<string, string>,
) {
  const body: ApiErrorResponse = {
    error: { code, message, ...(fieldErrors ? { fieldErrors } : {}) },
  }
  return HttpResponse.json(body, { status })
}

export async function readJson<T>(request: Request): Promise<Partial<T>> {
  try {
    return (await request.json()) as Partial<T>
  } catch {
    return {}
  }
}

export function authenticate(
  request: Request,
): { user: StoredUser; token: string } | { response: Response } {
  const header = request.headers.get('Authorization')
  const token = header?.startsWith('Bearer ') ? header.slice(7) : null
  if (!token) {
    return { response: errorResponse(401, 'UNAUTHORIZED', 'Faça login para continuar.') }
  }
  const session = db().sessions.find((s) => s.token === token)
  if (!session) {
    return { response: errorResponse(401, 'UNAUTHORIZED', 'Sessão inválida.') }
  }
  if (new Date(session.expiresAt).getTime() <= Date.now()) {
    return { response: errorResponse(401, 'SESSION_EXPIRED', 'Sua sessão expirou. Entre novamente.') }
  }
  const user = db().users.find((u) => u.id === session.userId)
  if (!user) {
    return { response: errorResponse(401, 'UNAUTHORIZED', 'Sessão inválida.') }
  }
  return { user, token }
}