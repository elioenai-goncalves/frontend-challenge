import { Link } from '@tanstack/react-router'

import type { Nft } from '@/contracts/api'
import { lowestAvailablePrice } from '@/lib/nft-price'

interface NftCardProps {
  nft: Nft
  priority?: boolean
}

export function NftCard({ nft, priority = false }: NftCardProps) {
  const price = lowestAvailablePrice(nft)
  const isRare = nft.attributes.Raridade === 'Raro'

  return (
    <li>
      <Link
        to="/nfts/$nftId"
        params={{ nftId: nft.id }}
        className="block rounded-lg bg-card p-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
      >
        <div className="relative aspect-square overflow-hidden rounded-md">
          <img
            src={nft.imageUrls[0]}
            alt={`${nft.name}, por ${nft.creatorName}`}
            width={400}
            height={400}
            loading={priority ? 'eager' : 'lazy'}
            className="size-full object-cover"
          />

          {isRare && (
            <span className="absolute top-3 left-0 bg-primary px-3 py-1 text-xs font-bold text-primary-foreground">
              RARO
            </span>
          )}
        </div>

        <h3 className="mt-3 text-sm font-bold">{nft.name}</h3>

        <p className="mt-1 text-sm text-primary">{price ? `${price} ETH` : 'Esgotado'}</p>
      </Link>
    </li>
  )
}