import { http, HttpResponse } from 'msw/http'
import type {
  AddCartItemRequest,
  CartResponse,
  MergeCartRequest,
  NftEdition,
  UpdateCartItemRequest,
} from '@/contracts/api'
import { commit, db, type StoredCart } from '../db'
import { authenticate, errorResponse, readJson } from '../utils'
import { resolveCart, userCartOf } from '../cart-access'

function findEdition(nftId: string, editionId: string): NftEdition | null {
  const nft = db().nfts.find((item) => item.id === nftId)
  return nft?.editions.find((edition) => edition.id === editionId) ?? null
}

function checkQuantity(total: number, edition: NftEdition): Response | null {
  if (!Number.isInteger(total) || total < 1) {
    return errorResponse(422, 'VALIDATION_ERROR', 'Quantidade inválida.', {
      quantity: 'Informe uma quantidade inteira maior que zero.',
    })
  }
  if (edition.availableQuantity === 0) {
    return errorResponse(409, 'OUT_OF_STOCK', 'Esta edição está indisponível.')
  }
  if (total > edition.maxPerOrder) {
    return errorResponse(422, 'VALIDATION_ERROR', 'Quantidade acima do limite.', {
      quantity: `O máximo por pedido é ${edition.maxPerOrder}.`,
    })
  }
  if (total > edition.availableQuantity) {
    return errorResponse(409, 'OUT_OF_STOCK', `Apenas ${edition.availableQuantity} disponíveis.`)
  }
  return null
}

function toResponse(cart: StoredCart): CartResponse {
  return { id: cart.id, userId: cart.userId, items: cart.items, version: cart.version }
}

export const cartHandlers = [
  http.get('/api/cart', ({ request }) => {
    const lookup = resolveCart(request)
    if ('response' in lookup) return lookup.response
    return HttpResponse.json(toResponse(lookup.cart))
  }),

  http.post('/api/cart/items', async ({ request }) => {
    const lookup = resolveCart(request)
    if ('response' in lookup) return lookup.response
    const { cart } = lookup

    const body = await readJson<AddCartItemRequest>(request)
    const edition = findEdition(body.nftId ?? '', body.editionId ?? '')
    if (!body.nftId || !edition) {
      return errorResponse(404, 'NOT_FOUND', 'NFT ou edição não encontrado.')
    }

    const existing = cart.items.find(
      (item) => item.nftId === body.nftId && item.editionId === edition.id,
    )
    const total = (existing?.quantity ?? 0) + Number(body.quantity)
    const invalid = checkQuantity(total, edition)
    if (invalid) return invalid

    if (existing) {
      existing.quantity = total
    } else {
      cart.items.push({
        id: crypto.randomUUID(),
        nftId: body.nftId,
        editionId: edition.id,
        quantity: total,
      })
    }
    cart.version += 1
    commit()
    return HttpResponse.json(toResponse(cart), { status: 201 })
  }),

  http.patch('/api/cart/items/:itemId', async ({ request, params }) => {
    const lookup = resolveCart(request)
    if ('response' in lookup) return lookup.response
    const { cart } = lookup

    const item = cart.items.find((i) => i.id === params.itemId)
    if (!item) return errorResponse(404, 'NOT_FOUND', 'Item não encontrado no carrinho.')

    const body = await readJson<UpdateCartItemRequest>(request)
    const edition = findEdition(item.nftId, item.editionId)
    if (!edition) return errorResponse(404, 'NOT_FOUND', 'Edição não encontrada.')

    const quantity = Number(body.quantity)
    const invalid = checkQuantity(quantity, edition)
    if (invalid) return invalid

    item.quantity = quantity
    cart.version += 1
    commit()
    return HttpResponse.json(toResponse(cart))
  }),

  http.delete('/api/cart/items/:itemId', ({ request, params }) => {
    const lookup = resolveCart(request)
    if ('response' in lookup) return lookup.response
    const { cart } = lookup

    if (!cart.items.some((i) => i.id === params.itemId)) {
      return errorResponse(404, 'NOT_FOUND', 'Item não encontrado no carrinho.')
    }
    cart.items = cart.items.filter((i) => i.id !== params.itemId)
    cart.version += 1
    commit()
    return HttpResponse.json(toResponse(cart))
  }),

  http.post('/api/cart/merge', async ({ request }) => {
    const auth = authenticate(request)
    if ('response' in auth) return auth.response

    const body = await readJson<MergeCartRequest>(request)
    const userCart = userCartOf(auth.user.id)
    const guest = db().carts.find((c) => c.id === body.guestCartId && c.userId === null)

    if (guest) {
      for (const guestItem of guest.items) {
        const edition = findEdition(guestItem.nftId, guestItem.editionId)
        if (!edition) continue
        const existing = userCart.items.find(
          (i) => i.nftId === guestItem.nftId && i.editionId === guestItem.editionId,
        )
        const cap = Math.min(edition.maxPerOrder, edition.availableQuantity)
        const quantity = Math.min((existing?.quantity ?? 0) + guestItem.quantity, cap)
        if (quantity < 1) continue
        if (existing) {
          existing.quantity = quantity
        } else {
          userCart.items.push({ ...guestItem, id: crypto.randomUUID(), quantity })
        }
      }
      db().carts = db().carts.filter((c) => c.id !== guest.id)
      userCart.version += 1
      commit()
    }
    return HttpResponse.json(toResponse(userCart))
  }),
]