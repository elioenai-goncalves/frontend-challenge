import { AxiosError } from 'axios'
import { useQuery } from '@tanstack/react-query'

import type { NftResponse } from '@/contracts/api'
import { api } from '@/lib/api-client'
import { nftKeys } from '@/hooks/use-nfts'

export function useNftDetail(
  nftId: string,
  userId: string | null,
) {
  return useQuery({
    queryKey: [
      ...nftKeys.scope(userId),
      'detail',
      nftId,
    ] as const,

    queryFn: async ({ signal }) => {
      const { data } = await api.get<NftResponse>(
        `/nfts/${encodeURIComponent(nftId)}`,
        { signal },
      )

      return data
    },

    retry: (failures, error) =>
      !(
        error instanceof AxiosError &&
        error.response?.status === 404
      ) && failures < 1,
  })
}