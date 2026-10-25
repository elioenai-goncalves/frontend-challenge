import { useMutation, useQueryClient } from '@tanstack/react-query'

import type {
  AddCartItemRequest,
  CartResponse,
} from '@/contracts/api'
import { api } from '@/lib/api-client'

const GUEST_CART_STORAGE_KEY =
  'frontend-challenge:guest-cart-id'

export function getGuestCartId(): string {
  let guestId = localStorage.getItem(
    GUEST_CART_STORAGE_KEY,
  )

  if (!guestId) {
    guestId = crypto.randomUUID()

    localStorage.setItem(
      GUEST_CART_STORAGE_KEY,
      guestId,
    )
  }

  return guestId
}

export const cartKeys = {
  forOwner: (userId: string | null) =>
    [
      'cart',
      userId ?? `guest:${getGuestCartId()}`,
    ] as const,
}

export function useAddCartItem(userId: string | null) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (item: AddCartItemRequest) => {
      const { data } = await api.post<CartResponse>(
        '/cart/items',
        item,
        userId
          ? undefined
          : {
              headers: {
                'X-Guest-Cart-Id': getGuestCartId(),
              },
            },
      )

      return data
    },

    onSuccess: (data) => {
      queryClient.setQueryData(
        cartKeys.forOwner(userId),
        data,
      )
    },
  })
}