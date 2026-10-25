import { useNavigate, useSearch } from '@tanstack/react-router'
import { Search } from 'lucide-react'

import { CatalogFilters } from '@/components/catalog/catalog-filters'
import { Hero } from '@/components/catalog/hero'
import { MobileFilters } from '@/components/catalog/mobile-filters'
import { NftCard } from '@/components/catalog/nft-card'
import { NftCardSkeleton } from '@/components/catalog/nft-card-skeleton'
import { EmptyState } from '@/components/empty-state'
import { ErrorState } from '@/components/error-state'
import { Button } from '@/components/ui/button'
import type { ListNftsRequest, NftSort } from '@/contracts/api'
import { useNftFacets, useNfts } from '@/hooks/use-nfts'
import { getApiErrorMessage } from '@/lib/api-client'
import { useSession } from '@/lib/session'

const SORT_OPTIONS: { value: NftSort; label: string }[] = [
  { value: 'recent', label: 'Listados recentemente' },
  { value: 'price-asc', label: 'Preço: menor primeiro' },
  { value: 'price-desc', label: 'Preço: maior primeiro' },
  { value: 'name-asc', label: 'Nome (A–Z)' },
]

const GRID_CLASS = 'grid grid-cols-2 gap-4 md:grid-cols-3'

export function HomePage() {
  const search = useSearch({ from: '/' })
  const navigate = useNavigate({ from: '/' })
  const session = useSession()
  const userId = session.user?.id ?? null

  const catalog = useNfts(search, userId)
  const featured = useNfts({ featured: true, pageSize: 3 }, userId)
  const facets = useNftFacets(userId)

  const page = search.page ?? 1
  const pageSize = search.pageSize ?? 12
  const total = catalog.data?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  const hasActiveFilters = Boolean(
    search.search ||
      search.categories?.length ||
      search.collectionIds?.length ||
      search.networks?.length ||
      search.minPriceEth ||
      search.maxPriceEth,
  )

  function updateSearch(patch: Partial<ListNftsRequest>, resetPage = true) {
    void navigate({
      search: (previous) => ({ ...previous, ...patch, ...(resetPage ? { page: 1 } : {}) }),
    })
  }

  function goToPage(next: number) {
    updateSearch({ page: next }, false)
    document.getElementById('catalogo')?.scrollIntoView()
  }

  function clearFilters() {
    void navigate({ search: {} })
  }

  const filters = (
    <CatalogFilters
      search={search}
      facets={facets.data}
      isLoading={facets.isPending}
      hasActiveFilters={hasActiveFilters}
      onChange={(patch) => updateSearch(patch)}
      onClear={clearFilters}
    />
  )

  const featuredItems = featured.data?.items ?? []

  return (
    <div className="flex flex-col gap-16">
      <Hero />

      {featuredItems.length > 0 && (
        <section aria-labelledby="destaques-titulo">
          <h2 id="destaques-titulo" className="mb-4 text-lg font-bold">
            Destaques
          </h2>
          <ul className="grid grid-cols-2 gap-4 md:grid-cols-3">
            {featuredItems.map((nft, index) => (
              <NftCard key={nft.id} nft={nft} priority={index < 3} />
            ))}
          </ul>
        </section>
      )}

      <section id="catalogo" aria-labelledby="catalogo-titulo" className="scroll-mt-6">
        <h2 id="catalogo-titulo" className="sr-only">
          Catálogo
        </h2>

        <div className="grid gap-8 lg:grid-cols-[15rem_1fr]">
          <aside aria-label="Filtros" className="hidden lg:block">
            {filters}
          </aside>

          <div>
            <div className="mb-6 flex flex-wrap items-center gap-3">
              <form
                role="search"
                onSubmit={(event) => {
                  event.preventDefault()
                  const value = new FormData(event.currentTarget).get('search')
                  const text = typeof value === 'string' ? value.trim() : ''
                  updateSearch({ search: text || undefined })
                }}
                className="flex min-w-0 flex-1 items-center gap-2"
              >
                <label htmlFor="catalogo-busca" className="sr-only">
                  Buscar NFTs
                </label>
                <input
                  id="catalogo-busca"
                  name="search"
                  key={search.search ?? ''}
                  defaultValue={search.search ?? ''}
                  placeholder="Buscar por nome, criador ou coleção"
                  className="h-10 min-w-0 flex-1 rounded-md border border-border bg-background/40 px-3 text-sm placeholder:text-text-secondary focus-visible:border-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                />
                <button
                  type="submit"
                  aria-label="Buscar"
                  className="inline-flex size-10 items-center justify-center rounded-md border border-border focus-visible:outline-2 focus-visible:outline-primary"
                >
                  <Search aria-hidden="true" size={18} strokeWidth={1.5} />
                </button>
              </form>

              <MobileFilters>{filters}</MobileFilters>

              <div className="flex items-center gap-2 text-sm">
                <label htmlFor="catalogo-ordem">Ordenar por:</label>
                <select
                  id="catalogo-ordem"
                  value={search.sort ?? 'recent'}
                  onChange={(event) => updateSearch({ sort: event.target.value as NftSort })}
                  className="h-10 rounded-md border border-border bg-background px-2 text-sm focus-visible:outline-2 focus-visible:outline-primary"
                >
                  {SORT_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <p role="status" className="mb-4 text-sm text-text-secondary">
              {catalog.data ? `${catalog.data.total} NFTs encontrados` : '\u00a0'}
            </p>

            {catalog.isPending ? (
              <ul aria-busy="true" aria-label="Carregando NFTs" className={GRID_CLASS}>
                {Array.from({ length: pageSize > 12 ? 12 : pageSize }, (_, index) => (
                  <NftCardSkeleton key={index} />
                ))}
              </ul>
            ) : catalog.isError ? (
              <ErrorState
                description={getApiErrorMessage(catalog.error)}
                onRetry={() => void catalog.refetch()}
                isRetrying={catalog.isFetching}
              />
            ) : catalog.data.items.length === 0 ? (
              <div className="flex flex-col items-center gap-4">
                <div className="w-full">
                  <EmptyState
                    title="Nenhum NFT encontrado"
                    description={
                      total > 0
                        ? 'Esta página não tem resultados. Volte para a primeira página.'
                        : 'Ajuste a busca ou os filtros para ver outros resultados.'
                    }
                  />
                </div>
                {total > 0 ? (
                  <Button type="button" onClick={() => goToPage(1)}>
                    Ir para a primeira página
                  </Button>
                ) : (
                  hasActiveFilters && (
                    <button
                      type="button"
                      onClick={clearFilters}
                      className="text-sm text-primary underline underline-offset-4"
                    >
                      Limpar filtros
                    </button>
                  )
                )}
              </div>
            ) : (
              <>
                <ul
                  aria-busy={catalog.isPlaceholderData}
                  className={`${GRID_CLASS} ${catalog.isPlaceholderData ? 'opacity-60' : ''}`}
                >
                  {catalog.data.items.map((nft) => (
                    <NftCard key={nft.id} nft={nft} />
                  ))}
                </ul>

                <nav aria-label="Paginação" className="mt-8 flex items-center justify-between gap-4">
                  <Button type="button" disabled={page <= 1} onClick={() => goToPage(page - 1)}>
                    Anterior
                  </Button>
                  <p className="text-sm">
                    Página {page} de {totalPages}
                  </p>
                  <Button type="button" disabled={page >= totalPages} onClick={() => goToPage(page + 1)}>
                    Próxima
                  </Button>
                </nav>
              </>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}