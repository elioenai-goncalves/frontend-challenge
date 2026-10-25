import { useQuery } from "@tanstack/react-query";

import type { OrderResponse } from "@/contracts/api";
import { api } from "@/lib/api-client";
import { preferNewestOrder } from "@/lib/realtime-snapshots";
import { getSession } from "@/lib/session";

export const orderKeys = {
  detail: (userId: string | null, orderId: string) =>
    ["orders", userId, orderId] as const,
};

export function useOrder(userId: string | null, orderId: string) {
  return useQuery({
    queryKey: orderKeys.detail(userId, orderId),

    queryFn: async ({ signal }) => {
      const { data } = await api.get<OrderResponse>(
        `/orders/${encodeURIComponent(orderId)}`,
        { signal },
      );

      if (getSession().user?.id !== userId) {
        throw new Error("A sessão mudou durante a consulta do pedido.");
      }

      return preferNewestOrder(data.order);
    },

    enabled: userId !== null,
    retry: false,
  });
}
