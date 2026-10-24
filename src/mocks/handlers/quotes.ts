import { http, HttpResponse } from 'msw/http'
import type { Network, QuoteItem, QuoteRequest, QuoteResponse } from '@/contracts/api'
import { resolveCart } from '../cart-access'
import { commit, db } from '../db'
import { fromUnits, toUnits } from '../decimal'
import { resolveImage } from '../images'
import { COUPONS, NETWORK_FEES_ETH, QUOTE_TTL_MS } from '../pricing'
import { errorResponse, readJson } from '../utils'

const NETWORKS: Network[] = ['ethereum', 'polygon', 'solana']

export const quoteHandlers = [
  http.post('/api/quotes', async ({ request }) => {
    const lookup = resolveCart(request)
    if ('response' in lookup) return lookup.response
    const { cart } = lookup

    const body = await readJson<QuoteRequest>(request)
    if (!body.network || !NETWORKS.includes(body.network)) {
      return errorResponse(422, 'VALIDATION_ERROR', 'Rede inválida.', {
        network: 'Escolha uma rede válida.',
      })
    }
    if (cart.items.length === 0) {
      return errorResponse(422, 'VALIDATION_ERROR', 'Seu carrinho está vazio.')
    }

    const items: QuoteItem[] = []
    let subtotal = 0n
    for (const cartItem of cart.items) {
      const nft = db().nfts.find((n) => n.id === cartItem.nftId)
      const edition = nft?.editions.find((e) => e.id === cartItem.editionId)
      if (!nft || !edition) {
        return errorResponse(404, 'NOT_FOUND', 'Um item do carrinho não existe mais.')
      }
      if (edition.availableQuantity < cartItem.quantity) {
        return errorResponse(
          409,
          'OUT_OF_STOCK',
          `${nft.name} (${edition.label}) não tem estoque suficiente.`,
        )
      }
      const line = toUnits(edition.priceEth) * BigInt(cartItem.quantity)
      subtotal += line
      items.push({
        nftId: nft.id,
        editionId: edition.id,
        nftName: nft.name,
        editionLabel: edition.label,
        imageUrl: resolveImage(nft.imageKeys[0] ?? ''),
        quantity: cartItem.quantity,
        unitPriceEth: edition.priceEth,
        lineTotalEth: fromUnits(line),
      })
    }

    const code = body.couponCode?.trim().toUpperCase() ?? ''
    let discount = 0n
    let appliedCode: string | null = null
    if (code) {
      const rule = COUPONS[code]
      if (!rule) {
        return errorResponse(400, 'INVALID_COUPON', 'Cupom inválido.', {
          couponCode: 'Cupom inválido.',
        })
      }
      if (rule.expired) {
        return errorResponse(400, 'EXPIRED_COUPON', 'Este cupom expirou.', {
          couponCode: 'Este cupom expirou.',
        })
      }
      discount = (subtotal * BigInt(rule.percent)) / 100n
      appliedCode = code
    }

    const fee = toUnits(NETWORK_FEES_ETH[body.network])
    const quote: QuoteResponse = {
      id: crypto.randomUUID(),
      cartId: cart.id,
      cartVersion: cart.version,
      network: body.network,
      items,
      couponCode: appliedCode,
      subtotalEth: fromUnits(subtotal),
      discountEth: fromUnits(discount),
      networkFeeEth: fromUnits(fee),
      totalEth: fromUnits(subtotal - discount + fee),
      expiresAt: new Date(Date.now() + QUOTE_TTL_MS).toISOString(),
    }
    db().quotes.push(quote)
    commit()
    return HttpResponse.json(quote, { status: 201 })
  }),
]