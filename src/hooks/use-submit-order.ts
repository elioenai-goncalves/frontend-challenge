import { useMutation, useQueryClient } from '@tanstack/react-query'

import type { OrderResponse } from '@/contracts/api'
import type { PendingOrder } from '@/lib/pending-order'

import { cartKeys } from '@/hooks/use-cart'
import { api } from '@/lib/api-client'
import { getSession } from '@/lib/session'

export function useSubmitOrder(userId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (attempt: PendingOrder) => {
      const { data } = await api.post<OrderResponse>(
        '/orders',
        attempt.request,
        {
          headers: {
            'Idempotency-Key': attempt.key,
          },
          timeout: 10_000,
        },
      )

      return data.order
    },

    retry: false,

    onSuccess: (order) => {
      // Apenas pagamentos confirmados alteram o carrinho.
      if (order.status !== 'confirmed') return

      // Evita atualizar dados de outra sessão.
      if (getSession().user?.id !== userId) return

      void queryClient.invalidateQueries({
        queryKey: cartKeys.forOwner(userId),
        exact: true,
      })
    },
  })
}