import type { Nft, Order } from '@/contracts/api'

const nftSnapshots = new Map<string, Nft>()
const orderSnapshots = new Map<string, Order>()

function orderKey(order: Order): string {
  return `${order.userId}:${order.id}`
}

function isTerminal(order: Order): boolean {
  return (
    order.status === 'confirmed' ||
    order.status === 'rejected'
  )
}

export function preferNewestNft(incoming: Nft): Nft {
  const previous = nftSnapshots.get(incoming.id)

  if (previous && previous.version >= incoming.version) {
    return previous
  }

  nftSnapshots.set(incoming.id, incoming)
  return incoming
}

export function registerNftEvent(nft: Nft): boolean {
  const previous = nftSnapshots.get(nft.id)

  if (previous && previous.version >= nft.version) {
    return false
  }

  nftSnapshots.set(nft.id, nft)
  return true
}

export function getNewestNft(
  nftId: string,
): Nft | undefined {
  return nftSnapshots.get(nftId)
}

export function preferNewestOrder(incoming: Order): Order {
  const key = orderKey(incoming)
  const previous = orderSnapshots.get(key)

  if (previous) {
    if (isTerminal(previous)) return previous

    if (previous.version >= incoming.version) {
      return previous
    }
  }

  orderSnapshots.set(key, incoming)
  return incoming
}

export function registerOrderEvent(order: Order): boolean {
  const key = orderKey(order)
  const previous = orderSnapshots.get(key)

  if (previous) {
    if (isTerminal(previous)) return false

    if (previous.version >= order.version) {
      return false
    }
  }

  orderSnapshots.set(key, order)
  return true
}

export function clearRealtimeSnapshots(): void {
  nftSnapshots.clear()
  orderSnapshots.clear()
}