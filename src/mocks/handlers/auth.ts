import { http, HttpResponse } from 'msw/http'
import type { LoginRequest, RegisterRequest, SessionResponse, User } from '@/contracts/api'
import { commit, db, type StoredUser } from '../db'
import { hashPassword, randomSalt } from '../password'
import { authenticate, errorResponse, readJson } from '../utils'

const SESSION_DURATION_MS = 8 * 60 * 60 * 1000
export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function toUser(user: StoredUser): User {
  return { id: user.id, name: user.name, email: user.email, avatarUrl: user.avatarUrl }
}

function openSession(user: StoredUser): SessionResponse {
  const token = crypto.randomUUID()
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS).toISOString()
  db().sessions.push({ token, userId: user.id, expiresAt })
  commit()
  return { user: toUser(user), accessToken: token, expiresAt }
}

export const authHandlers = [
  http.post('/api/auth/register', async ({ request }) => {
    const body = await readJson<RegisterRequest>(request)
    const name = body.name?.trim() ?? ''
    const email = body.email?.trim().toLowerCase() ?? ''
    const password = body.password ?? ''

    const fieldErrors: Record<string, string> = {}
    if (name.length < 2) fieldErrors.name = 'Informe seu nome.'
    if (!EMAIL_PATTERN.test(email)) fieldErrors.email = 'Informe um e-mail válido.'
    if (password.length < 8) fieldErrors.password = 'A senha deve ter ao menos 8 caracteres.'
    if (Object.keys(fieldErrors).length > 0) {
      return errorResponse(422, 'VALIDATION_ERROR', 'Verifique os campos informados.', fieldErrors)
    }

    if (db().users.some((u) => u.email === email)) {
      return errorResponse(409, 'CONFLICT', 'Este e-mail já está cadastrado.', {
        email: 'Este e-mail já está cadastrado.',
      })
    }

    const passwordSalt = randomSalt()
    const user: StoredUser = {
      id: crypto.randomUUID(),
      name,
      email,
      avatarUrl: null,
      passwordSalt,
      passwordHash: await hashPassword(password, passwordSalt),
    }
    db().users.push(user)
    db().favorites[user.id] = []
    db().wallets[user.id] = []

    return HttpResponse.json(openSession(user), { status: 201 })
  }),

  http.post('/api/auth/login', async ({ request }) => {
    const body = await readJson<LoginRequest>(request)
    const email = body.email?.trim().toLowerCase() ?? ''
    const user = db().users.find((u) => u.email === email)

    const hash = user ? await hashPassword(body.password ?? '', user.passwordSalt) : null
    if (!user || hash !== user.passwordHash) {
      return errorResponse(401, 'INVALID_CREDENTIALS', 'E-mail ou senha incorretos.')
    }
    return HttpResponse.json(openSession(user))
  }),

  http.get('/api/auth/session', ({ request }) => {
    const auth = authenticate(request)
    if ('response' in auth) return auth.response
    const session = db().sessions.find((s) => s.token === auth.token)!
    const body: SessionResponse = {
      user: toUser(auth.user),
      accessToken: auth.token,
      expiresAt: session.expiresAt,
    }
    return HttpResponse.json(body)
  }),

  http.post('/api/auth/logout', ({ request }) => {
    const auth = authenticate(request)
    if ('response' in auth) return auth.response
    db().sessions = db().sessions.filter((s) => s.token !== auth.token)
    commit()
    return HttpResponse.json({ success: true as const })
  }),
]