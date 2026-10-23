import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api-client'
import type {
  ListNftsRequest,
  ListNftsResponse,
} from '@/contracts/api'

export const nftKeys = {
  all: ['nfts'] as const,

  scope: (userId: string | null) =>
    [...nftKeys.all, userId] as const,

  list: (
    userId: string | null,
    params: ListNftsRequest = {},
  ) => [...nftKeys.scope(userId), 'list', params] as const,
}

export function useNfts(
  params: ListNftsRequest = {},
  userId: string | null = null,
) {
  return useQuery({
    queryKey: nftKeys.list(userId, params),

    queryFn: async ({ signal }) => {
      const { data } = await api.get<ListNftsResponse>('/nfts', {
        params,
        signal,
        paramsSerializer: {
          indexes: null,
        },
      })

      return data
    },
  })
}