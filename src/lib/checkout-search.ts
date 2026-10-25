import type { Network } from '@/contracts/api'

export interface CheckoutSearch {
  network: Network
  couponCode?: string
}

export function validateCheckoutSearch(
  search: Record<string, unknown>,
): CheckoutSearch {
  const network: Network =
    search.network === 'polygon' ||
    search.network === 'solana'
      ? search.network
      : 'ethereum'

  const code =
    typeof search.couponCode === 'string'
      ? search.couponCode.trim().toUpperCase()
      : ''

  return {
    network,
    ...(code ? { couponCode: code.slice(0, 40) } : {}),
  }
}