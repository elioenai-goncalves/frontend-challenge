import type { Nft } from '@/contracts/api'
import type { StoredNft } from './db'
import { toUnits } from './decimal'
import { resolveImage } from './images'

export function toNft(stored: StoredNft): Nft {
  const { imageKeys, ...rest } = stored
  return { ...rest, imageUrls: imageKeys.map(resolveImage) }
}

// Preço de listagem: o menor entre as edições.
export function listingPrice(stored: StoredNft): bigint {
  return stored.editions
    .map((edition) => toUnits(edition.priceEth))
    .reduce((lowest, price) => (price < lowest ? price : lowest))
}