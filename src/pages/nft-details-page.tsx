import { useState } from 'react'
import { AxiosError } from 'axios'
import { Link, useNavigate, useParams } from '@tanstack/react-router'
import { Heart, ShoppingCart } from 'lucide-react'

import type { Nft } from '@/contracts/api'
import { NftDetailsExtras } from '@/components/catalog/nft-details-extras'
import { EmptyState } from '@/components/empty-state'
import { ErrorState } from '@/components/error-state'
import { LoadingSkeleton } from '@/components/ui/loading-skeleton'
import { useFavorites, useToggleFavorite } from '@/hooks/use-favorites'
import { useAddCartItem } from '@/hooks/use-cart'
import { useNftDetail } from '@/hooks/use-nft-detail'
import { getApiErrorMessage } from '@/lib/api-client'
import { useSession } from '@/lib/session'

function DetailSkeleton() {
  return (
    <div role="status" aria-label="Carregando detalhe do NFT" className="grid gap-6 lg:grid-cols-2">
      <span className="sr-only">Carregando detalhe do NFT...</span>
      <LoadingSkeleton className="aspect-square w-full" />
      <div className="space-y-5">
        <LoadingSkeleton className="h-8 w-3/4" />
        <LoadingSkeleton className="h-5 w-1/3" />
        <LoadingSkeleton className="h-32 w-full" />
        <LoadingSkeleton className="h-12 w-1/2" />
      </div>
    </div>
  )
}

function DetailView({ nft }: { nft: Nft }) {
  const session = useSession()
  const userId = session.user?.id ?? null
  const navigate = useNavigate({ from: '/nfts/$nftId' })
  const favorites = useFavorites(userId)
  const toggleFavorite = useToggleFavorite(userId)
  const addToCart = useAddCartItem(userId)

  const [activeImageIndex, setActiveImageIndex] = useState(0)
  const [editionId, setEditionId] = useState(
    nft.editions.find((item) => item.availableQuantity > 0)?.id ?? nft.editions[0]?.id ?? '',
  )
  const [requestedQuantity, setRequestedQuantity] = useState('1')

  const edition = nft.editions.find((item) => item.id === editionId)
  const maxQuantity = edition ? Math.min(edition.availableQuantity, edition.maxPerOrder) : 0
  const parsedQuantity = Number(requestedQuantity)
  const quantityValid = /^\d+$/.test(requestedQuantity) &&
    Number.isSafeInteger(parsedQuantity) && parsedQuantity >= 1 && parsedQuantity <= maxQuantity
  const isFavorite = favorites.data?.nftIds.includes(nft.id) ?? false
  const image = nft.imageUrls[activeImageIndex] ?? nft.imageUrls[0]

  function changeQuantity(delta: number) {
    setRequestedQuantity(String(Math.min(Math.max(parsedQuantity + delta, 1), Math.max(1, maxQuantity))))
  }

  function handleFavorite() {
    if (session.status !== 'authenticated') {
      void navigate({ to: '/login', search: { redirect: `/nfts/${encodeURIComponent(nft.id)}` } })
      return
    }
    if (favorites.isPending || favorites.isError || toggleFavorite.isPending) return
    toggleFavorite.mutate({ nftId: nft.id, isFavorite })
  }

  function handleAddToCart() {
    if (!edition || !quantityValid || addToCart.isPending) return
    addToCart.mutate(
      { nftId: nft.id, editionId: edition.id, quantity: parsedQuantity },
      { onSuccess: () => void navigate({ to: '/cart' }) },
    )
  }

  return (
    <article className="pb-36 lg:pb-0">
      <nav aria-label="Caminho de navegação" className="mb-6 hidden text-sm text-text-secondary lg:block">
        <Link to="/" search={{}} className="text-foreground hover:text-primary">Início</Link>
        <span aria-hidden="true" className="mx-2">/</span>
        <span>Mercado</span>
      </nav>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-10">
        <section aria-label="Galeria do NFT" className="min-w-0">
          <div className="grid items-start gap-3 lg:grid-cols-[72px_minmax(0,1fr)]">
            <div className="hidden flex-col gap-3 lg:flex" aria-label="Miniaturas da galeria">
              {nft.imageUrls.map((url, index) => (
                <button
                  key={`${url}-${index}`}
                  type="button"
                  onClick={() => setActiveImageIndex(index)}
                  aria-label={`Ver imagem ${index + 1}`}
                  aria-pressed={activeImageIndex === index}
                  className={`size-18 overflow-hidden rounded-md border-2 ${activeImageIndex === index ? 'border-primary' : 'border-transparent'}`}
                >
                  <img src={url} alt="" loading="lazy" className="size-full object-cover" />
                </button>
              ))}
            </div>

            <div className="aspect-square w-full overflow-hidden rounded-[22px] bg-card lg:rounded-lg lg:p-3">
              {image ? (
                <img
                  src={image}
                  alt={`${nft.name}, imagem ${activeImageIndex + 1} de ${nft.imageUrls.length}`}
                  width={560}
                  height={560}
                  className="size-full rounded-[20px] object-cover lg:rounded-lg"
                />
              ) : (
                <div className="grid h-full place-items-center text-text-secondary">Imagem indisponível</div>
              )}
            </div>
          </div>
        </section>

        <section aria-labelledby="nft-detail-title" className="min-w-0">
          <p className="text-xs text-primary lg:hidden">{nft.collectionName}</p>
          <h1 id="nft-detail-title" className="mt-1 text-[23px] font-bold leading-tight lg:mt-0 lg:text-[30px]">
            {nft.name}
          </h1>

          <p className="mt-3 text-xl font-bold text-primary lg:text-2xl">
            {edition?.priceEth ?? '—'} ETH
          </p>
          <div className="mt-2 h-px bg-primary/25 lg:mt-3" />

          <h2 className="mt-5 text-sm font-semibold lg:text-base">Sobre este NFT:</h2>
          <p className="mt-2 text-sm leading-6 text-text-secondary">{nft.description}</p>

          <fieldset className="mt-5">
            <legend className="mb-2 font-semibold">Edição:</legend>
            <div className="flex flex-wrap gap-2">
              {nft.editions.map((item) => (
                <label
                  key={item.id}
                  className={[
                    'cursor-pointer rounded-full border px-3 py-2 text-xs focus-within:outline-2 focus-within:outline-primary',
                    item.id === editionId ? 'border-primary bg-primary/10 text-primary' : 'border-primary/30 text-text-secondary',
                    item.availableQuantity === 0 ? 'opacity-60' : '',
                  ].join(' ')}
                >
                  <input
                    className="sr-only"
                    type="radio"
                    name="nft-edition"
                    value={item.id}
                    checked={item.id === editionId}
                    onChange={() => { setEditionId(item.id); setRequestedQuantity('1') }}
                  />
                  {item.label} · {item.availableQuantity > 0 ? `${item.availableQuantity} disponíveis` : 'Esgotada'}
                </label>
              ))}
            </div>
          </fieldset>

          <div className="mt-5 flex flex-wrap items-end gap-5 lg:mt-6">
            <div>
              <label htmlFor="nft-quantity" className="mb-2 block text-sm font-bold">Quantidade</label>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => changeQuantity(-1)}
                  disabled={parsedQuantity <= 1 || maxQuantity === 0}
                  aria-label="Diminuir quantidade"
                  className="size-9 rounded-full bg-primary font-bold text-primary-foreground disabled:opacity-40"
                >−</button>
                <input
                  id="nft-quantity"
                  type="number"
                  inputMode="numeric"
                  min={1}
                  max={Math.max(1, maxQuantity)}
                  step={1}
                  value={requestedQuantity}
                  disabled={maxQuantity === 0}
                  aria-invalid={!quantityValid && maxQuantity > 0}
                  aria-describedby="nft-quantity-help"
                  onChange={(event) => setRequestedQuantity(event.currentTarget.value)}
                  onBlur={() => {
                    const value = Number(requestedQuantity)
                    setRequestedQuantity(String(Number.isSafeInteger(value) ? Math.max(1, Math.min(Math.max(1, maxQuantity), value)) : 1))
                  }}
                  className="h-9 w-12 [appearance:textfield] bg-transparent text-center text-sm [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                />
                <button
                  type="button"
                  onClick={() => changeQuantity(1)}
                  disabled={parsedQuantity >= maxQuantity || maxQuantity === 0}
                  aria-label="Aumentar quantidade"
                  className="size-9 rounded-full bg-primary font-bold text-primary-foreground disabled:opacity-40"
                >+</button>
              </div>
              <p id="nft-quantity-help" role="status" className="mt-2 text-xs text-text-secondary">
                {maxQuantity > 0 ? `Máximo: ${maxQuantity} por compra.` : 'Edição indisponível.'}
              </p>
            </div>

            <div className="hidden gap-3 lg:flex">
              <button
                type="button"
                onClick={handleAddToCart}
                disabled={!quantityValid || addToCart.isPending}
                aria-busy={addToCart.isPending}
                className="inline-flex min-h-11 items-center gap-2 rounded-md bg-primary px-6 text-sm font-bold text-primary-foreground disabled:opacity-50"
              >
                <ShoppingCart size={16} aria-hidden="true" />
                {addToCart.isPending ? 'Adicionando...' : 'Adicionar ao carrinho'}
              </button>
              <button
                type="button"
                onClick={handleFavorite}
                disabled={toggleFavorite.isPending || (session.status === 'authenticated' && (favorites.isPending || favorites.isError))}
                aria-pressed={session.status === 'authenticated' ? isFavorite : undefined}
                className="inline-flex min-h-11 items-center gap-2 rounded-md border border-primary px-4 text-sm font-bold text-primary disabled:opacity-50"
              >
                <Heart size={17} fill={isFavorite ? 'currentColor' : 'none'} aria-hidden="true" />
                {isFavorite ? 'Desfavoritar' : 'Favoritar'}
              </button>
            </div>
          </div>

          <dl className="mt-5 space-y-2 text-sm text-text-secondary">
            <div><dt className="inline">ID do token: </dt><dd className="inline">{nft.id}</dd></div>
            <div><dt className="inline">Coleção: </dt><dd className="inline">{nft.collectionName}</dd></div>
            <div><dt className="inline">Rede: </dt><dd className="inline">{nft.network}</dd></div>
            <div><dt className="inline">Atributos: </dt><dd className="inline">{Object.entries(nft.attributes).map(([key, value]) => `${key}: ${value}`).join(', ')}</dd></div>
          </dl>

          {favorites.isError && (
            <div role="alert" className="mt-4 text-sm text-destructive">
              Não foi possível consultar os favoritos.
              <button type="button" onClick={() => void favorites.refetch()} className="ml-2 underline">Tentar novamente</button>
            </div>
          )}
          {toggleFavorite.isError && <p role="alert" className="mt-3 text-sm text-destructive">{getApiErrorMessage(toggleFavorite.error)}</p>}
          {addToCart.isError && <p role="alert" className="mt-3 text-sm text-destructive">{getApiErrorMessage(addToCart.error)}</p>}
        </section>
      </div>

      <NftDetailsExtras nft={nft} userId={userId} />

      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-primary/20 bg-card px-6 py-4 pb-[calc(1rem+env(safe-area-inset-bottom))] lg:hidden">
        <div className="mx-auto max-w-103.5">
          <div className="mb-3 flex items-center justify-between gap-3 text-sm">
            <span>Qtd. {requestedQuantity}</span>
            <span className="font-bold text-primary">{edition?.priceEth ?? '—'} ETH / un.</span>
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleAddToCart}
              disabled={!quantityValid || addToCart.isPending}
              aria-label="Adicionar ao carrinho"
              aria-busy={addToCart.isPending}
              className="min-h-12 flex-1 rounded-full bg-primary px-4 font-bold text-primary-foreground disabled:opacity-50"
            >
              {addToCart.isPending ? 'Adicionando...' : 'Comprar NFT'}
            </button>
            <button
              type="button"
              onClick={handleFavorite}
              aria-label={isFavorite ? 'Desfavoritar' : 'Favoritar'}
              aria-pressed={session.status === 'authenticated' ? isFavorite : undefined}
              disabled={toggleFavorite.isPending || (session.status === 'authenticated' && (favorites.isPending || favorites.isError))}
              className="grid size-12 shrink-0 place-items-center rounded-full border border-primary/30 text-primary disabled:opacity-50"
            >
              <Heart size={19} fill={isFavorite ? 'currentColor' : 'none'} aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
    </article>
  )
}

export function NftDetailsPage() {
  const { nftId } = useParams({ from: '/nfts/$nftId' })
  const session = useSession()
  const detail = useNftDetail(nftId, session.user?.id ?? null)

  if (detail.isPending) return <DetailSkeleton />
  if (detail.isError) {
    if (detail.error instanceof AxiosError && detail.error.response?.status === 404) {
      return (
        <div className="space-y-6">
          <EmptyState title="NFT não encontrado" description="O NFT solicitado não existe neste catálogo." />
          <Link to="/" search={{}} className="text-primary underline">Voltar ao catálogo</Link>
        </div>
      )
    }
    return <ErrorState description={getApiErrorMessage(detail.error)} onRetry={() => void detail.refetch()} isRetrying={detail.isFetching} />
  }
  if (!detail.data) return <EmptyState title="NFT indisponível" description="Não foi possível carregar o item solicitado." />

  return <DetailView key={detail.data.nft.id} nft={detail.data.nft} />
}
