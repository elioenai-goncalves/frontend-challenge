import { Hero } from '@/components/catalog/hero'
import { NftCard } from '@/components/catalog/nft-card'
import { useNftFacets, useNfts } from '@/hooks/use-nfts'

/** Catálogo de verdade exibido somente ATRÁS dos modais de autenticação desktop. */
export function AuthBackdropPreview() {
  const catalog = useNfts({ page: 1, pageSize: 9, sort: 'recent' })
  const facets = useNftFacets()

  return (
    <div aria-hidden="true" inert className="hidden lg:block pointer-events-none select-none">
      <Hero />
      <div className="mt-20 grid grid-cols-[240px_minmax(0,1fr)] gap-9">
        <aside className="h-fit bg-card p-5">
          <h2 className="text-sm font-bold">Coleções</h2>
          <div className="mt-3 space-y-4 text-xs text-text-secondary">
            {facets.data?.categories.map((category) => (
              <div key={category.name} className="flex justify-between gap-3">
                <span>{category.name}</span>
                <span>({category.count})</span>
              </div>
            ))}
          </div>
          <h2 className="mt-8 text-sm font-bold">Faixa de preço</h2>
          <div className="mt-4 h-1 rounded-full bg-primary" />
          <p className="mt-3 text-xs text-text-secondary">Selecione uma faixa</p>
          <h2 className="mt-8 text-sm font-bold">Rede</h2>
          <div className="mt-4 space-y-4 text-xs text-text-secondary">
            <div>Ethereum</div><div>Polygon</div><div>Solana</div>
          </div>
        </aside>
        <section>
          <div className="mb-7 flex items-center justify-between text-sm text-text-secondary">
            <span className="text-primary">Todos os NFTs</span>
            <span>Novos lançamentos &nbsp; Em alta</span>
          </div>
          {catalog.data && (
            <ul className="grid grid-cols-3 gap-5">
              {catalog.data.items.map((nft) => (
                <NftCard key={nft.id} nft={nft} />
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  )
}
