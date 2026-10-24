import type { Nft } from '@/contracts/api'
import type { StoredNft } from './db'
import { toUnits } from './decimal'
import { resolveImage } from './images'

export function toNft(stored: StoredNft): Nft {
  const { imageKeys, ...rest } = stored
  return { ...rest, imageUrls: imageKeys.map(resolveImage) }
}

// Menor preço entre as edições disponíveis; null se nenhuma estiver disponível.
export function listingPrice(stored: StoredNft): bigint | null {
  const prices = stored.editions
    .filter((edition) => edition.availableQuantity > 0)
    .map((edition) => toUnits(edition.priceEth))
  if (prices.length === 0) return null
  return prices.reduce((lowest, price) => (price < lowest ? price : lowest))
}