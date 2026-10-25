import { useState } from "react";
import { AxiosError } from "axios";
import { useQueries } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Trash2 } from "lucide-react";

import { EmptyState } from "@/components/empty-state";
import { ErrorState } from "@/components/error-state";
import { LoadingSkeleton } from "@/components/ui/loading-skeleton";
import { CartSummary } from "@/components/cart/cart-summary";

import type { NftResponse } from "@/contracts/api";
import { preferNewestNft } from "@/lib/realtime-snapshots";

import {
  useCart,
  useRemoveCartItem,
  useUpdateCartItem,
} from "@/hooks/use-cart";

import { nftKeys } from "@/hooks/use-nfts";
import { api, getApiErrorMessage } from "@/lib/api-client";
import { useSession } from "@/lib/session";

function CartSkeleton() {
  return (
    <div
      role="status"
      aria-label="Carregando carrinho"
      className="grid gap-6 lg:grid-cols-[1fr_18rem]"
    >
      <span className="sr-only">Carregando itens do carrinho...</span>

      <div className="space-y-4">
        <LoadingSkeleton className="h-36 w-full" />
        <LoadingSkeleton className="h-36 w-full" />
      </div>

      <LoadingSkeleton className="h-48 w-full" />
    </div>
  );
}

export function CartPage() {
  const session = useSession();
  const userId = session.user?.id ?? null;

  const cart = useCart(userId);
  const updateItem = useUpdateCartItem(userId);
  const removeItem = useRemoveCartItem(userId);

  const [actionError, setActionError] = useState<string | null>(null);

  const items = cart.data?.items ?? [];

  const nftIds = [...new Set(items.map((item) => item.nftId))];

  const nftQueries = useQueries({
    queries: nftIds.map((nftId) => ({
      queryKey: [...nftKeys.scope(userId), "detail", nftId] as const,

      queryFn: async ({ signal }: { signal: AbortSignal }) => {
        const { data } = await api.get<NftResponse>(
          `/nfts/${encodeURIComponent(nftId)}`,
          { signal },
        );

        return {
          nft: preferNewestNft(data.nft),
        };
      },
    })),
  });

  const nftById = new Map(
    nftIds.map((id, index) => [id, nftQueries[index]?.data?.nft] as const),
  );

  const isDetailsPending = nftQueries.some((query) => query.isPending);

  const failedDetails = nftQueries.some(
    (query) =>
      query.isError &&
      !(
        query.error instanceof AxiosError &&
        query.error.response?.status === 404
      ),
  );

  const isMutating = updateItem.isPending || removeItem.isPending;

  function handleUpdate(itemId: string, quantity: number) {
    if (isMutating) return;

    setActionError(null);

    updateItem.mutate(
      { itemId, quantity },
      {
        onError: (error) => {
          setActionError(getApiErrorMessage(error));
        },
      },
    );
  }

  function handleRemove(itemId: string) {
    if (isMutating) return;

    setActionError(null);

    removeItem.mutate(itemId, {
      onError: (error) => {
        setActionError(getApiErrorMessage(error));
      },
    });
  }

  if (cart.isPending || isDetailsPending) {
    return (
      <section aria-labelledby="cart-title">
        <h1 id="cart-title" className="mb-8 text-3xl font-bold">
          Meu carrinho
        </h1>

        <CartSkeleton />
      </section>
    );
  }

  if (cart.isError) {
    return (
      <ErrorState
        description={getApiErrorMessage(cart.error)}
        onRetry={() => void cart.refetch()}
        isRetrying={cart.isFetching}
      />
    );
  }

  if (failedDetails) {
    return (
      <ErrorState
        description="Não foi possível carregar os dados dos NFTs do carrinho."
        onRetry={() => {
          nftQueries.forEach((query) => {
            if (query.isError) void query.refetch();
          });
        }}
        isRetrying={nftQueries.some((query) => query.isFetching)}
      />
    );
  }

  return (
    <section aria-labelledby="cart-title">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <h1 id="cart-title" className="text-3xl font-bold">
          Meu carrinho
        </h1>

        <Link
          to="/"
          search={{}}
          className="text-sm text-primary underline underline-offset-4"
        >
          Continuar explorando
        </Link>
      </div>

      {items.length === 0 ? (
        <div className="space-y-6">
          <EmptyState
            title="Seu carrinho está vazio"
            description="Explore o catálogo e adicione um NFT para começar."
          />

          <Link
            to="/"
            search={{}}
            className="inline-block rounded-md bg-primary px-5 py-3 font-semibold text-primary-foreground"
          >
            Explorar NFTs
          </Link>
        </div>
      ) : (
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_18rem]">
          <div>
            <ul
              aria-label="Itens do carrinho"
              aria-busy={isMutating}
              className="space-y-4"
            >
              {items.map((item) => {
                const nft = nftById.get(item.nftId);

                const edition = nft?.editions.find(
                  (entry) => entry.id === item.editionId,
                );

                const maxQuantity = edition
                  ? Math.min(edition.availableQuantity, edition.maxPerOrder)
                  : 0;

                const unavailable =
                  !nft || !edition || maxQuantity < item.quantity;

                const quantities = Array.from(
                  {
                    length: Math.max(maxQuantity, item.quantity),
                  },
                  (_, index) => index + 1,
                );

                return (
                  <li
                    key={item.id}
                    className="rounded-lg border border-border bg-card p-3 sm:p-4"
                  >
                    <div className="flex items-start gap-3">
                      {nft?.imageUrls[0] ? (
                        <img
                          src={nft.imageUrls[0]}
                          alt={nft.name}
                          width={160}
                          height={160}
                          className="size-24 shrink-0 rounded-md object-cover sm:size-32"
                        />
                      ) : (
                        <div className="grid size-24 shrink-0 place-items-center rounded-md bg-background text-xs text-text-secondary sm:size-32">
                          Imagem indisponível
                        </div>
                      )}

                      <div className="min-w-0 flex-1">
                        {nft ? (
                          <Link
                            to="/nfts/$nftId"
                            params={{ nftId: nft.id }}
                            className="font-bold hover:text-primary"
                          >
                            {nft.name}
                          </Link>
                        ) : (
                          <p className="font-bold">NFT indisponível</p>
                        )}

                        <p className="mt-2 text-sm text-text-secondary">
                          {edition?.label ?? "Edição não encontrada"}
                        </p>

                        <p className="mt-2 font-semibold text-primary">
                          {edition
                            ? `${edition.priceEth} ETH por unidade`
                            : "Preço indisponível"}
                        </p>

                        {unavailable && (
                          <p
                            role="status"
                            className="mt-3 text-sm text-destructive"
                          >
                            Item indisponível ou quantidade acima do estoque
                            atual. Ajuste ou remova o item.
                          </p>
                        )}

                        <div className="mt-5 flex flex-wrap items-end gap-4">
                          <div>
                            <label
                              htmlFor={`cart-quantity-${item.id}`}
                              className="mb-2 block text-sm"
                            >
                              Quantidade
                            </label>

                            <select
                              id={`cart-quantity-${item.id}`}
                              value={item.quantity}
                              disabled={isMutating || maxQuantity === 0}
                              onChange={(event) => {
                                handleUpdate(
                                  item.id,
                                  Number(event.currentTarget.value),
                                );
                              }}
                              className="h-11 min-w-20 rounded-md border border-border bg-background px-3"
                            >
                              {quantities.map((quantity) => (
                                <option
                                  key={quantity}
                                  value={quantity}
                                  disabled={quantity > maxQuantity}
                                >
                                  {quantity}
                                </option>
                              ))}
                            </select>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleRemove(item.id)}
                            disabled={isMutating}
                            aria-label={`Remover ${nft?.name ?? "NFT"} do carrinho`}
                            className="inline-flex min-h-11 items-center gap-2 rounded-md border border-border px-4 text-sm text-foreground hover:text-destructive focus-visible:outline-2 focus-visible:outline-primary disabled:opacity-50"
                          >
                            <Trash2 size={16} aria-hidden="true" />
                            Remover
                          </button>
                        </div>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>

            {actionError && (
              <p
                role="alert"
                className="mt-4 rounded-md border border-destructive p-4 text-sm text-destructive"
              >
                {actionError}
              </p>
            )}

            {isMutating && (
              <p role="status" className="mt-3 text-sm text-text-secondary">
                Atualizando carrinho...
              </p>
            )}
          </div>

          <CartSummary
            key={userId ?? "guest"}
            cart={cart.data!}
            userId={userId}
            isCartUpdating={isMutating}
          />
        </div>
      )}
    </section>
  );
}
