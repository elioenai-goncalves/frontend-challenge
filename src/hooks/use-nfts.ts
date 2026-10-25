import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import type {
  ListNftsRequest,
  ListNftsResponse,
  NftFacetsResponse,
} from "@/contracts/api";
import { preferNewestNft } from "@/lib/realtime-snapshots";

export const nftKeys = {
  all: ["nfts"] as const,

  scope: (userId: string | null) => [...nftKeys.all, userId] as const,

  list: (userId: string | null, params: ListNftsRequest = {}) =>
    [...nftKeys.scope(userId), "list", params] as const,

  facets: (userId: string | null) =>
    [...nftKeys.scope(userId), "facets"] as const,
};

export function useNfts(
  params: ListNftsRequest = {},
  userId: string | null = null,
) {
  return useQuery({
    queryKey: nftKeys.list(userId, params),

    queryFn: async ({ signal }) => {
      const { data } = await api.get<ListNftsResponse>("/nfts", {
        params,
        signal,
        paramsSerializer: { indexes: null },
      });

      return {
        ...data,
        items: data.items.map(preferNewestNft),
      };
    },

    placeholderData: keepPreviousData,
  });
}

export function useNftFacets(userId: string | null = null) {
  return useQuery({
    queryKey: nftKeys.facets(userId),

    queryFn: async ({ signal }) => {
      const { data } = await api.get<NftFacetsResponse>("/nfts/facets", {
        signal,
      });
      return data;
    },

    staleTime: 60_000,
  });
}
