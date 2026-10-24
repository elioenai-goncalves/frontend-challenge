import type {
  ListNftsRequest,
  Network,
  NftSort,
} from '@/contracts/api'

function positiveInteger(
  value: unknown,
  fallback: number,
  max = Number.MAX_SAFE_INTEGER,
): number {
  if (typeof value !== 'string' && typeof value !== 'number') {
    return fallback
  }

  const parsed = Number(value)

  if (!Number.isSafeInteger(parsed) || parsed < 1) {
    return fallback
  }

  return Math.min(parsed, max)
}

function stringList(value: unknown): string[] | undefined {
  const values = Array.isArray(value) ? value : [value]

  const items = values
    .filter((item): item is string => typeof item === 'string')
    .map((item) => item.trim())
    .filter((item) => item.length > 0)

  const uniqueItems = [...new Set(items)]

  return uniqueItems.length > 0 ? uniqueItems : undefined
}

function isNetwork(value: string): value is Network {
  return (
    value === 'ethereum' ||
    value === 'polygon' ||
    value === 'solana'
  )
}

function sortValue(value: unknown): NftSort {
  switch (value) {
    case 'recent':
    case 'price-asc':
    case 'price-desc':
    case 'name-asc':
      return value

    default:
      return 'recent'
  }
}

function ethAmount(value: unknown): string | undefined {
  const text =
    typeof value === 'string'
      ? value.trim()
      : typeof value === 'number' && Number.isFinite(value)
        ? String(value)
        : ''

  return /^\d+(\.\d+)?$/.test(text) ? text : undefined
}

export function validateCatalogSearch(
  search: Record<string, unknown>,
): ListNftsRequest {
  const networks = stringList(search.networks)?.filter(isNetwork)

  return {
    search:
      typeof search.search === 'string'
        ? search.search.trim() || undefined
        : undefined,

    collectionIds: stringList(search.collectionIds),
    categories: stringList(search.categories),

    networks:
      networks && networks.length > 0 ? networks : undefined,

    minPriceEth: ethAmount(search.minPriceEth),
    maxPriceEth: ethAmount(search.maxPriceEth),

    sort: sortValue(search.sort),
    page: positiveInteger(search.page, 1),
    pageSize: positiveInteger(search.pageSize, 12, 48),
  }
}