import type {
  ListNftsResponse,
  NftResponse,
  NftUpdatedEvent,
  OrderUpdatedEvent,
} from '@/contracts/api'

import { nftKeys } from '@/hooks/use-nfts'
import { orderKeys } from '@/hooks/use-order'
import { cartKeys } from '@/hooks/use-cart'
import { queryClient } from '@/lib/query-client'

export async function applyNftUpdated(
  event: NftUpdatedEvent,
  versions: Map<string, number>,
  isActive: () => boolean,
): Promise<void> {
  if (!isActive()) return

  if (
    event.resourceId !== event.nft.id ||
    event.version !== event.nft.version
  ) {
    return
  }

  const latest = versions.get(event.resourceId) ?? 0

  if (event.version <= latest) return

  versions.set(event.resourceId, event.version)

  await queryClient.cancelQueries({
    queryKey: nftKeys.all,
  })

  if (
    !isActive() ||
    versions.get(event.resourceId) !== event.version
  ) {
    return
  }

  const queries = queryClient
    .getQueryCache()
    .findAll({ queryKey: nftKeys.all })

  for (const query of queries) {
    const key = query.queryKey

    if (
      key[2] === 'detail' &&
      key[3] === event.resourceId
    ) {
      queryClient.setQueryData<NftResponse>(
        key,
        (previous) => {
          if (
            previous &&
            previous.nft.version >= event.version
          ) {
            return previous
          }

          return { nft: event.nft }
        },
      )
    }

    if (key[2] === 'list') {
      queryClient.setQueryData<ListNftsResponse>(
        key,
        (previous) => {
          if (!previous) return previous

          const hasNft = previous.items.some(
            (item) =>
              item.id === event.resourceId &&
              item.version < event.version,
          )

          if (!hasNft) return previous

          return {
            ...previous,
            items: previous.items.map((item) => {
              if (
                item.id !== event.resourceId ||
                item.version >= event.version
              ) {
                return item
              }

              return event.nft
            }),
          }
        },
      )
    }
  }

  void queryClient.invalidateQueries({
    queryKey: nftKeys.all,
    refetchType: 'active',
  })

  void queryClient.invalidateQueries({
    queryKey: ['quote'],
    refetchType: 'active',
  })
}

export function applyOrderUpdated(
  event: OrderUpdatedEvent,
  userId: string,
  socketId: string | undefined,
  versions: Map<string, number>,
  isActive: () => boolean,
): void {
  if (!isActive()) return

  if (
    !socketId ||
    event.sessionId !== socketId ||
    event.userId !== userId ||
    event.order.userId !== userId ||
    event.resourceId !== event.order.id ||
    event.version !== event.order.version
  ) {
    return
  }

  const latest = versions.get(event.resourceId) ?? 0

  if (event.version <= latest) return

  const key = orderKeys.detail(
    userId,
    event.resourceId,
  )

  const previous = queryClient.getQueryData<
    typeof event.order
  >(key)

  if (
    previous?.status === 'confirmed' ||
    previous?.status === 'rejected'
  ) {
    return
  }

  if (
    previous &&
    previous.version >= event.version
  ) {
    return
  }

  versions.set(event.resourceId, event.version)

  queryClient.setQueryData(key, event.order)

  if (event.order.status === 'confirmed') {
    void queryClient.invalidateQueries({
      queryKey: cartKeys.forOwner(userId),
      refetchType: 'active',
    })
  }
}