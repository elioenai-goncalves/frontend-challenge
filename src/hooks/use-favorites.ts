import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'

import type {
  AddFavoriteRequest,
  FavoritesResponse,
} from '@/contracts/api'

import { api } from '@/lib/api-client'
import { getSession } from '@/lib/session'

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

  const queryKey = favoriteKeys.list(userId)

  function isCurrentUser() {
    return (
      userId !== null &&
      getSession().user?.id === userId
    )
  }

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

    onMutate: async ({ nftId, isFavorite }) => {
      // Impede que uma consulta pendente sobrescreva
      // a atualização otimista.
      await queryClient.cancelQueries({
        queryKey,
        exact: true,
      })

      // Guarda o estado anterior para possível rollback.
      const previous =
        queryClient.getQueryData<FavoritesResponse>(queryKey)

      if (previous && isCurrentUser()) {
        queryClient.setQueryData<FavoritesResponse>(
          queryKey,
          {
            nftIds: isFavorite
              ? previous.nftIds.filter((id) => id !== nftId)
              : [...new Set([...previous.nftIds, nftId])],
          },
        )
      }

      return { previous }
    },

    onError: (_error, _variables, context) => {
      // Se falhar, restaura os favoritos anteriores.
      if (context?.previous && isCurrentUser()) {
        queryClient.setQueryData(
          queryKey,
          context.previous,
        )
      }
    },

    onSuccess: (data) => {
      if (!isCurrentUser()) return

      // Substitui a previsão otimista pela resposta real.
      queryClient.setQueryData(queryKey, data)

      // Sincroniza novamente com o servidor.
      void queryClient.invalidateQueries({
        queryKey,
        exact: true,
      })
    },
  })
}