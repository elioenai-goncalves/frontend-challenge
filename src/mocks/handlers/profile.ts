import { http, HttpResponse } from 'msw/http'
import type { ChangePasswordRequest, ProfileResponse, UpdateProfileRequest } from '@/contracts/api'
import { commit, db } from '../db'
import { hashPassword, randomSalt } from '../password'
import { authenticate, errorResponse, readJson } from '../utils'
import { EMAIL_PATTERN, toUser } from './auth'

const DATA_URL = /^data:image\/(png|jpeg|webp|gif);base64,[A-Za-z0-9+/=]+$/
const MAX_DATA_URL_LENGTH = 300_000

function isValidAvatar(value: unknown): value is string | null {
  if (value === null) return true
  if (typeof value !== 'string') return false
  if (value.startsWith('data:')) {
    return value.length <= MAX_DATA_URL_LENGTH && DATA_URL.test(value)
  }
  try {
    const url = new URL(value)
    return url.protocol === 'https:' || url.protocol === 'http:'
  } catch {
    return false
  }
}

export const profileHandlers = [
  http.get('/api/profile', ({ request }) => {
    const auth = authenticate(request)
    if ('response' in auth) return auth.response
    const body: ProfileResponse = { user: toUser(auth.user) }
    return HttpResponse.json(body)
  }),

  http.patch('/api/profile', async ({ request }) => {
    const auth = authenticate(request)
    if ('response' in auth) return auth.response

    const body = await readJson<UpdateProfileRequest>(request)
    const name = body.name?.trim() ?? ''
    const email = body.email?.trim().toLowerCase() ?? ''

    const fieldErrors: Record<string, string> = {}
    if (name.length < 2) fieldErrors.name = 'Informe seu nome.'
    if (!EMAIL_PATTERN.test(email)) fieldErrors.email = 'Informe um e-mail válido.'
    if (!isValidAvatar(body.avatarUrl ?? null)) {
      fieldErrors.avatarUrl = 'Use uma URL de imagem ou uma imagem pequena (até 300 KB).'
    }
    if (Object.keys(fieldErrors).length > 0) {
      return errorResponse(422, 'VALIDATION_ERROR', 'Verifique os campos informados.', fieldErrors)
    }

    if (db().users.some((u) => u.id !== auth.user.id && u.email === email)) {
      return errorResponse(409, 'CONFLICT', 'Este e-mail já está em uso.', {
        email: 'Este e-mail já está em uso.',
      })
    }

    auth.user.name = name
    auth.user.email = email
    auth.user.avatarUrl = body.avatarUrl ?? null
    commit()
    const response: ProfileResponse = { user: toUser(auth.user) }
    return HttpResponse.json(response)
  }),

  http.put('/api/profile/password', async ({ request }) => {
    const auth = authenticate(request)
    if ('response' in auth) return auth.response

    const body = await readJson<ChangePasswordRequest>(request)
    const current = body.currentPassword ?? ''
    const next = body.newPassword ?? ''

    const currentHash = await hashPassword(current, auth.user.passwordSalt)
    if (currentHash !== auth.user.passwordHash) {
      return errorResponse(422, 'VALIDATION_ERROR', 'Senha atual incorreta.', {
        currentPassword: 'Senha atual incorreta.',
      })
    }
    if (next.length < 8) {
      return errorResponse(422, 'VALIDATION_ERROR', 'Senha nova inválida.', {
        newPassword: 'A senha deve ter ao menos 8 caracteres.',
      })
    }
    if (next === current) {
      return errorResponse(422, 'VALIDATION_ERROR', 'Senha nova inválida.', {
        newPassword: 'Use uma senha diferente da atual.',
      })
    }

    auth.user.passwordSalt = randomSalt()
    auth.user.passwordHash = await hashPassword(next, auth.user.passwordSalt)
    db().sessions = db().sessions.filter(
      (s) => s.userId !== auth.user.id || s.token === auth.token,
    )
    commit()
    return HttpResponse.json({ success: true as const })
  }),
]