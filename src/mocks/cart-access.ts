import { commit, db, type StoredCart } from './db'
import { authenticate, errorResponse } from './utils'

export type CartLookup = { cart: StoredCart } | { response: Response }

export function userCartOf(userId: string): StoredCart {
  const existing = db().carts.find((c) => c.userId === userId)
  if (existing) return existing
  const cart: StoredCart = { id: crypto.randomUUID(), userId, items: [], version: 1 }
  db().carts.push(cart)
  commit()
  return cart
}

export function resolveCart(request: Request): CartLookup {
  if (request.headers.has('Authorization')) {
    const auth = authenticate(request)
    if ('response' in auth) return { response: auth.response }
    return { cart: userCartOf(auth.user.id) }
  }

  const guestId = request.headers.get('X-Guest-Cart-Id')?.trim()
  if (!guestId) {
    return {
      response: errorResponse(
        422,
        'VALIDATION_ERROR',
        'Identifique o carrinho de visitante com o cabeçalho X-Guest-Cart-Id.',
      ),
    }
  }

  const existing = db().carts.find((c) => c.id === guestId)
  if (existing && existing.userId !== null) {
    return { response: errorResponse(403, 'FORBIDDEN', 'Este carrinho pertence a outro usuário.') }
  }
  if (existing) return { cart: existing }

  const cart: StoredCart = { id: guestId, userId: null, items: [], version: 1 }
  db().carts.push(cart)
  commit()
  return { cart }
}