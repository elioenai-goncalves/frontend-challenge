import type { Nft } from '@/contracts/api'
import { compareEth } from '@/lib/decimal'

// Menor preço entre as edições disponíveis; null se nenhuma estiver disponível.
export function lowestAvailablePrice(nft: Nft): string | null {
  const prices = nft.editions.filter((edition) => edition.availableQuantity > 0).map((e) => e.priceEth)
  if (prices.length === 0) return null
  return prices.reduce((lowest, price) => (compareEth(price, lowest) < 0 ? price : lowest))
}