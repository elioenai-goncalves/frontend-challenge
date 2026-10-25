import type { CreateOrderRequest } from '@/contracts/api'

export interface PendingOrder {
  key: string
  request: CreateOrderRequest
  createdAt: string
}

function storageKey(userId: string): string {
  return `frontend-challenge:pending-order:${userId}`
}

export function readPendingOrder(
  userId: string,
): PendingOrder | null {
  try {
    const raw = localStorage.getItem(storageKey(userId))

    if (!raw) return null

    const value = JSON.parse(raw) as Partial<PendingOrder>

    if (
      typeof value.key !== 'string' ||
      typeof value.createdAt !== 'string' ||
      !value.request ||
      typeof value.request.quoteId !== 'string' ||
      typeof value.request.walletId !== 'string' ||
      typeof value.request.network !== 'string' ||
      typeof value.request.collector?.name !== 'string' ||
      typeof value.request.collector?.email !== 'string'
    ) {
      return null
    }

    return value as PendingOrder
  } catch {
    return null
  }
}

export function savePendingOrder(
  userId: string,
  attempt: PendingOrder,
): void {
  localStorage.setItem(
    storageKey(userId),
    JSON.stringify(attempt),
  )
}

export function clearPendingOrder(
  userId: string,
  key: string,
): void {
  const stored = readPendingOrder(userId)

  if (stored?.key === key) {
    localStorage.removeItem(storageKey(userId))
  }
}