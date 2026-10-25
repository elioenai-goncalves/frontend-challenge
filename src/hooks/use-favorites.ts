import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import type {
  AddFavoriteRequest,
  FavoritesResponse,
} from '@/contracts/api'
import { api } from '@/lib/api-client'

export const favoriteKeys = {
  list: (userId: string | null) =>
    ['favorites', userId] as const,
}

export function useFavorites(userId: string | null) {
  return useQuery({
    queryKey: favoriteKeys.list(userId),

    queryFn: async ({ signal }) => {
      const { data } = await api.get<FavoritesResponse>(
        '/favorites',
        { signal },
      )

      return data
    },

    enabled: userId !== null,
  })
}

interface ToggleFavoriteInput {
  nftId: string
  isFavorite: boolean
}

export function useToggleFavorite(userId: string | null) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      nftId,
      isFavorite,
    }: ToggleFavoriteInput) => {
      if (isFavorite) {
        const { data } = await api.delete<FavoritesResponse>(
          `/favorites/${encodeURIComponent(nftId)}`,
        )

        return data
      }

      const body: AddFavoriteRequest = { nftId }

      const { data } = await api.post<FavoritesResponse>(
        '/favorites',
        body,
      )

      return data
    },

    onSuccess: (data) => {
      queryClient.setQueryData(
        favoriteKeys.list(userId),
        data,
      )
    },
  })
}