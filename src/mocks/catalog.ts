import type { Network } from '@/contracts/api'
import type { StoredNft } from './db'
import { fromUnits, toUnits } from './decimal'

interface BaseNft {
  name: string
  creatorName: string
  collectionId: string
  collectionName: string
  category: string
  network: Network
  imageKey: string
  priceEth: string
  featured: boolean
}

const BASES: BaseNft[] = [
  { name: 'Ape Jaqueta Verde', creatorName: 'Marina Costa', collectionId: 'ape-club', collectionName: 'Ape Club', category: 'Arte', network: 'ethereum', imageKey: 'ape-green-jacket', priceEth: '1.19', featured: true },
  { name: 'Gorila Moletom Roxo', creatorName: 'Rafael Dias', collectionId: 'gorilla-lab', collectionName: 'Gorilla Lab', category: 'Colecionáveis', network: 'polygon', imageKey: 'gorilla-purple-hoodie', priceEth: '0.45', featured: true },
  { name: 'Gorila Jaqueta Bege', creatorName: 'Marina Costa', collectionId: 'urban-primates', collectionName: 'Urban Primates', category: 'Moda digital', network: 'ethereum', imageKey: 'gorilla-beige-jacket', priceEth: '2.3', featured: false },
  { name: 'Ape Fones Laranja', creatorName: 'Lucas Prado', collectionId: 'neon-jungle', collectionName: 'Neon Jungle', category: 'Arte', network: 'solana', imageKey: 'ape-orange-headphones', priceEth: '0.08', featured: true },
  { name: 'Macaco Aviador', creatorName: 'Lucas Prado', collectionId: 'ape-club', collectionName: 'Ape Club', category: 'Arte', network: 'polygon', imageKey: 'ape-green-jacket', priceEth: '0.9', featured: false },
  { name: 'Gorila Capuz Neon', creatorName: 'Rafael Dias', collectionId: 'neon-jungle', collectionName: 'Neon Jungle', category: 'Colecionáveis', network: 'solana', imageKey: 'gorilla-purple-hoodie', priceEth: '0.15', featured: false },
  { name: 'Gorila Executivo', creatorName: 'Marina Costa', collectionId: 'urban-primates', collectionName: 'Urban Primates', category: 'Moda digital', network: 'ethereum', imageKey: 'gorilla-beige-jacket', priceEth: '3.75', featured: false },
  { name: 'Macaco DJ', creatorName: 'Lucas Prado', collectionId: 'gorilla-lab', collectionName: 'Gorilla Lab', category: 'Colecionáveis', network: 'polygon', imageKey: 'ape-orange-headphones', priceEth: '0.3', featured: false },
]

const TOTAL = 16
const DAY_MS = 24 * 60 * 60 * 1000
const FIRST_DATE = Date.UTC(2026, 9, 1)

export function buildNfts(): StoredNft[] {
  return Array.from({ length: TOTAL }, (_, index) => {
    const base = BASES[index % BASES.length]
    const round = Math.floor(index / BASES.length)
    const number = String(index + 1).padStart(2, '0')
    const id = `nft-${number}`
    const standardUnits = (toUnits(base.priceEth) * BigInt(100 + 15 * round)) / 100n
    const limitedUnits = (standardUnits * 25n) / 10n

    return {
      id,
      name: `${base.name} #${number}`,
      description: `${base.name}, peça digital da coleção ${base.collectionName}, criada por ${base.creatorName}.`,
      creatorName: base.creatorName,
      collectionId: base.collectionId,
      collectionName: base.collectionName,
      category: base.category,
      network: base.network,
      imageKeys: [base.imageKey],
      editions: [
        {
          id: `${id}-standard`,
          label: 'Edição padrão',
          priceEth: fromUnits(standardUnits),
          availableQuantity: 5 + (index % 4) * 3,
          maxPerOrder: 3,
        },
        {
          id: `${id}-limited`,
          label: 'Edição limitada',
          priceEth: fromUnits(limitedUnits),
          availableQuantity: index % 3 === 0 ? 0 : 2,
          maxPerOrder: 1,
        },
      ],
      attributes: { Fundo: round === 0 ? 'Liso' : 'Degradê', Raridade: index % 3 === 0 ? 'Raro' : 'Comum' },
      featured: round === 0 && base.featured,
      createdAt: new Date(FIRST_DATE - index * DAY_MS).toISOString(),
      version: 1,
    }
  })
}