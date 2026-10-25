import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'

import type {
  AddCartItemRequest,
  CartResponse,
  UpdateCartItemRequest,
} from '@/contracts/api'

import { api } from '@/lib/api-client'
import { getSession } from '@/lib/session'

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

function cartHeaders(userId: string | null) {
  if (userId !== null) return undefined

  return {
    'X-Guest-Cart-Id': getGuestCartId(),
  }
}

export const cartKeys = {
  forOwner: (userId: string | null) =>
    [
      'cart',
      userId ?? `guest:${getGuestCartId()}`,
    ] as const,
}

export function useCart(userId: string | null) {
  return useQuery({
    queryKey: cartKeys.forOwner(userId),

    queryFn: async ({ signal }) => {
      const pendingGuestCartId =
        userId !== null
          ? localStorage.getItem(GUEST_CART_STORAGE_KEY)
          : null

      if (userId !== null && pendingGuestCartId) {
        const { data } = await api.post<CartResponse>(
          '/cart/merge',
          {
            guestCartId: pendingGuestCartId,
          },
          { signal },
        )

        if (getSession().user?.id !== userId) {
          throw new Error(
            'A sessão mudou durante a mesclagem do carrinho.',
          )
        }

        if (
          localStorage.getItem(GUEST_CART_STORAGE_KEY) ===
          pendingGuestCartId
        ) {
          localStorage.removeItem(GUEST_CART_STORAGE_KEY)
        }

        return data
      }

      const { data } = await api.get<CartResponse>(
        '/cart',
        {
          headers: cartHeaders(userId),
          signal,
        },
      )

      return data
    },
  })
}

export function useCartCount(userId: string | null) {
  const cart = useCart(userId)

  const count =
    cart.data?.items.reduce(
      (total, item) => total + item.quantity,
      0,
    ) ?? 0

  return {
    count,
    isError: cart.isError,
  }
}

export function useAddCartItem(userId: string | null) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (item: AddCartItemRequest) => {
      const { data } = await api.post<CartResponse>(
        '/cart/items',
        item,
        {
          headers: cartHeaders(userId),
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

interface UpdateCartItemInput {
  itemId: string
  quantity: number
}

export function useUpdateCartItem(userId: string | null) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      itemId,
      quantity,
    }: UpdateCartItemInput) => {
      const body: UpdateCartItemRequest = {
        quantity,
      }

      const { data } = await api.patch<CartResponse>(
        `/cart/items/${encodeURIComponent(itemId)}`,
        body,
        {
          headers: cartHeaders(userId),
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

export function useRemoveCartItem(userId: string | null) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (itemId: string) => {
      const { data } = await api.delete<CartResponse>(
        `/cart/items/${encodeURIComponent(itemId)}`,
        {
          headers: cartHeaders(userId),
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