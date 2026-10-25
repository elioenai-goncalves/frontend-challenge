import { useState } from 'react'
import { AxiosError } from 'axios'
import { Link, useParams } from '@tanstack/react-router'

import { EmptyState } from '@/components/empty-state'
import { ErrorState } from '@/components/error-state'
import { LoadingSkeleton } from '@/components/ui/loading-skeleton'
import type { Nft } from '@/contracts/api'
import { useNftDetail } from '@/hooks/use-nft-detail'
import { getApiErrorMessage } from '@/lib/api-client'
import { useSession } from '@/lib/session'

function NftDetailSkeleton() {
  return (
    <div
      role="status"
      aria-label="Carregando detalhe do NFT"
      className="grid gap-8 lg:grid-cols-2"
    >
      <span className="sr-only">
        Carregando detalhe do NFT...
      </span>

      <div>
        <LoadingSkeleton className="aspect-square w-full" />
        <div className="mt-3 flex gap-3">
          <LoadingSkeleton className="size-20" />
          <LoadingSkeleton className="size-20" />
        </div>
      </div>

      <div className="space-y-5">
        <LoadingSkeleton className="h-10 w-3/4" />
        <LoadingSkeleton className="h-5 w-2/3" />
        <LoadingSkeleton className="h-20 w-full" />
        <LoadingSkeleton className="h-16 w-full" />
        <LoadingSkeleton className="h-12 w-1/2" />
      </div>
    </div>
  )
}

function NftDetailContent({ nft }: { nft: Nft }) {
  const [activeImageIndex, setActiveImageIndex] = useState(0)

  const [editionId, setEditionId] = useState(
    nft.editions.find(
      (edition) => edition.availableQuantity > 0,
    )?.id ?? nft.editions[0]?.id ?? '',
  )

  const [requestedQuantity, setRequestedQuantity] = useState(1)

  const activeImage =
    nft.imageUrls[activeImageIndex] ?? nft.imageUrls[0]

  const edition =
    nft.editions.find((item) => item.id === editionId) ?? null

  const limit = edition
    ? Math.min(
        edition.availableQuantity,
        edition.maxPerOrder,
      )
    : 0

  const quantity = Math.min(
    Math.max(requestedQuantity, 1),
    Math.max(limit, 1),
  )

  const isAvailable = limit > 0

  return (
    <>
      <nav
        aria-label="Caminho de navegação"
        className="mb-8 text-sm text-text-secondary"
      >
        <Link
          to="/"
          search={{}}
          className="hover:text-primary focus-visible:outline-primary"
        >
          Início
        </Link>

        <span aria-hidden="true" className="mx-2">/</span>
        <span aria-current="page">{nft.name}</span>
      </nav>

      <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
        <section
          aria-label="Galeria do NFT"
          className="min-w-0"
        >
          <div className="aspect-square overflow-hidden rounded-lg bg-card">
            {activeImage ? (
              <img
                src={activeImage}
                alt={`${nft.name}, imagem ${activeImageIndex + 1} de ${nft.imageUrls.length}`}
                width={600}
                height={600}
                className="size-full object-cover"
              />
            ) : (
              <div className="grid size-full place-items-center text-text-secondary">
                Imagem indisponível
              </div>
            )}
          </div>

          {nft.imageUrls.length > 1 && (
            <div
              role="group"
              aria-label="Escolher imagem"
              className="mt-3 flex flex-wrap gap-3"
            >
              {nft.imageUrls.map((url, index) => (
                <button
                  key={`${url}-${index}`}
                  type="button"
                  onClick={() => setActiveImageIndex(index)}
                  aria-label={`Ver imagem ${index + 1}`}
                  aria-pressed={index === activeImageIndex}
                  className={[
                    'size-20 overflow-hidden rounded-md border-2',
                    'focus-visible:outline-2 focus-visible:outline-offset-2',
                    'focus-visible:outline-primary',
                    index === activeImageIndex
                      ? 'border-primary'
                      : 'border-border',
                  ].join(' ')}
                >
                  <img
                    src={url}
                    alt=""
                    className="size-full object-cover"
                    loading="lazy"
                  />
                </button>
              ))}
            </div>
          )}
        </section>

        <section
          aria-labelledby="nft-detail-title"
          className="min-w-0"
        >
          <p className="text-sm text-primary">
            {nft.collectionName}
          </p>

          <h1
            id="nft-detail-title"
            className="mt-2 text-3xl font-bold"
          >
            {nft.name}
          </h1>

          <p className="mt-3 text-sm text-text-secondary">
            Criado por {nft.creatorName} · Rede {nft.network}
          </p>

          <p className="mt-6 leading-relaxed text-text-secondary">
            {nft.description}
          </p>

          <fieldset className="mt-8">
            <legend className="mb-3 font-semibold">
              Selecione a edição
            </legend>

            <div className="grid gap-3">
              {nft.editions.map((item) => {
                const soldOut = item.availableQuantity === 0

                return (
                  <label
                    key={item.id}
                    className={[
                      'flex cursor-pointer items-start gap-3',
                      'rounded-lg border p-4',
                      item.id === editionId
                        ? 'border-primary bg-card'
                        : 'border-border',
                    ].join(' ')}
                  >
                    <input
                      type="radio"
                      name="nft-edition"
                      value={item.id}
                      checked={editionId === item.id}
                      onChange={() => {
                        setEditionId(item.id)
                        setRequestedQuantity(1)
                      }}
                      className="mt-1 accent-primary"
                    />

                    <span className="min-w-0 flex-1">
                      <span className="block font-medium">
                        {item.label}
                      </span>

                      <span className="mt-1 block text-sm text-text-secondary">
                        {soldOut
                          ? 'Esgotada — esta edição não pode ser comprada'
                          : `${item.availableQuantity} disponíveis · limite de ${item.maxPerOrder} por pedido`}
                      </span>
                    </span>

                    <span className="shrink-0 font-semibold text-primary">
                      {item.priceEth} ETH
                    </span>
                  </label>
                )
              })}

              {nft.editions.length === 0 && (
                <p className="text-text-secondary">
                  Não há edições cadastradas.
                </p>
              )}
            </div>
          </fieldset>

          <div className="mt-6">
            <label
              htmlFor="nft-quantity"
              className="mb-2 block font-semibold"
            >
              Quantidade
            </label>

            <input
              id="nft-quantity"
              type="number"
              inputMode="numeric"
              min={1}
              max={Math.max(limit, 1)}
              step={1}
              value={quantity}
              disabled={!isAvailable}
              onChange={(event) => {
                const next = Number(event.currentTarget.value)

                setRequestedQuantity(
                  Number.isInteger(next)
                    ? Math.min(Math.max(next, 1), limit)
                    : 1,
                )
              }}
              aria-describedby="nft-quantity-help"
              className={[
                'h-11 w-28 rounded-md border border-border',
                'bg-card px-3 text-foreground disabled:opacity-50',
              ].join(' ')}
            />

            <p
              id="nft-quantity-help"
              role="status"
              className="mt-2 text-sm text-text-secondary"
            >
              {isAvailable
                ? `Máximo: ${limit} por compra.`
                : 'Esta edição está indisponível para compra.'}
            </p>
          </div>

          {Object.keys(nft.attributes).length > 0 && (
            <section
              aria-labelledby="nft-attributes-title"
              className="mt-8"
            >
              <h2
                id="nft-attributes-title"
                className="font-semibold"
              >
                Características
              </h2>

              <dl className="mt-3 grid grid-cols-2 gap-3">
                {Object.entries(nft.attributes).map(
                  ([name, value]) => (
                    <div
                      key={name}
                      className="rounded-md border border-border bg-card p-3"
                    >
                      <dt className="text-xs text-text-secondary">
                        {name}
                      </dt>
                      <dd className="mt-1 text-sm font-semibold">
                        {value}
                      </dd>
                    </div>
                  ),
                )}
              </dl>
            </section>
          )}
        </section>
      </div>
    </>
  )
}

export function NftDetailsPage() {
  const { nftId } = useParams({ from: '/nfts/$nftId' })
  const session = useSession()

  const detail = useNftDetail(
    nftId,
    session.user?.id ?? null,
  )

  if (detail.isPending) {
    return <NftDetailSkeleton />
  }

  if (detail.isError) {
    if (
      detail.error instanceof AxiosError &&
      detail.error.response?.status === 404
    ) {
      return (
        <div className="space-y-6">
          <EmptyState
            title="NFT não encontrado"
            description="O NFT solicitado não existe neste catálogo."
          />
          <Link
            to="/"
            search={{}}
            className="inline-block text-primary underline"
          >
            Voltar ao catálogo
          </Link>
        </div>
      )
    }

    return (
      <ErrorState
        description={getApiErrorMessage(detail.error)}
        onRetry={() => void detail.refetch()}
        isRetrying={detail.isFetching}
      />
    )
  }

  if (!detail.data) {
    return (
      <EmptyState
        title="NFT indisponível"
        description="Não foi possível carregar o item solicitado."
      />
    )
  }

  return (
    <NftDetailContent
      key={detail.data.nft.id}
      nft={detail.data.nft}
    />
  )
}