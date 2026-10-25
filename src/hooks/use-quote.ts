import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'

import type {
  CartResponse,
  Network,
  QuoteRequest,
  QuoteResponse,
} from '@/contracts/api'

import { getGuestCartId } from '@/hooks/use-cart'
import { api } from '@/lib/api-client'
import { getSession } from '@/lib/session'

export const quoteKeys = {
  forCart: (
    userId: string | null,
    cart: CartResponse,
    network: Network,
    couponCode: string | null,
  ) =>
    [
      'quote',
      userId ?? `guest:${getGuestCartId()}`,
      cart.id,
      cart.version,
      network,
      couponCode ?? '',
    ] as const,
}

async function requestQuote(
  userId: string | null,
  body: QuoteRequest,
  signal?: AbortSignal,
): Promise<QuoteResponse> {
  const { data } = await api.post<QuoteResponse>(
    '/quotes',
    body,
    {
      signal,
      headers:
        userId === null
          ? {
              'X-Guest-Cart-Id': getGuestCartId(),
            }
          : undefined,
    },
  )

  return data
}

export function useQuote(
  userId: string | null,
  cart: CartResponse,
  network: Network,
  couponCode: string | null,
) {
  return useQuery({
    queryKey: quoteKeys.forCart(
      userId,
      cart,
      network,
      couponCode,
    ),

    queryFn: ({ signal }) =>
      requestQuote(
        userId,
        {
          network,
          ...(couponCode ? { couponCode } : {}),
        },
        signal,
      ),

    enabled: cart.items.length > 0,
    retry: false,
    staleTime: 15_000,
  })
}

export function useQuoteAction(userId: string | null) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (body: QuoteRequest) =>
      requestQuote(userId, body),

    onSuccess: (quote) => {
      // Não escreve resultados pertencentes a outra sessão.
      if (
        (getSession().user?.id ?? null) !== userId
      ) {
        return
      }

      const cart: CartResponse = {
        id: quote.cartId,
        userId,
        items: [],
        version: quote.cartVersion,
      }

      queryClient.setQueryData(
        quoteKeys.forCart(
          userId,
          cart,
          quote.network,
          quote.couponCode,
        ),
        quote,
      )
    },
  })
}