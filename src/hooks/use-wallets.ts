import { useQuery } from '@tanstack/react-query'

import type { WalletsResponse } from '@/contracts/api'
import { api } from '@/lib/api-client'

export const walletKeys = {
  list: (userId: string) =>
    ['wallets', userId] as const,
}

export function useWallets(userId: string) {
  return useQuery({
    queryKey: walletKeys.list(userId),

    queryFn: async ({ signal }) => {
      const { data } = await api.get<WalletsResponse>(
        '/wallets',
        { signal },
      )

      return data
    },
  })
}