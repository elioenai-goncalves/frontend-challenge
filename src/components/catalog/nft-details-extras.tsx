import { useState } from 'react'

import type { Nft } from '@/contracts/api'
import { useNfts } from '@/hooks/use-nfts'
import { NftCard } from '@/components/catalog/nft-card'

export function NftDetailsExtras({ nft, userId }: { nft: Nft; userId: string | null }) {
  const [selectedTab, setSelectedTab] = useState<'details' | 'editions'>('details')
  const recommendations = useNfts({ collectionIds: [nft.collectionId], pageSize: 6 }, userId)
  const related = (recommendations.data?.items ?? []).filter((item) => item.id !== nft.id).slice(0, 5)

  return (
    <div className="mt-10 space-y-12 lg:mt-20 lg:space-y-20">
      <section aria-label="Informações do NFT">
        <div className="flex gap-6 border-b border-primary/25 text-sm sm:gap-8">
          <button
            type="button"
            onClick={() => setSelectedTab('details')}
            aria-pressed={selectedTab === 'details'}
            className={`border-b-2 pb-3 font-semibold ${selectedTab === 'details' ? 'border-primary text-primary' : 'border-transparent text-foreground'}`}
          >
            Detalhes do NFT
          </button>
          <button
            type="button"
            onClick={() => setSelectedTab('editions')}
            aria-pressed={selectedTab === 'editions'}
            className={`border-b-2 pb-3 font-semibold ${selectedTab === 'editions' ? 'border-primary text-primary' : 'border-transparent text-foreground'}`}
          >
            Edições e atributos
          </button>
        </div>

        {selectedTab === 'details' ? (
          <div className="max-w-5xl space-y-4 pt-5 text-sm leading-7 text-text-secondary">
            <p>{nft.description}</p>
            <p>Obra digital da coleção {nft.collectionName}, criada por {nft.creatorName}. Consulte a disponibilidade das edições e os dados de rede antes de comprar.</p>
            <dl className="space-y-2">
              <div><dt className="inline font-bold text-foreground">Rede: </dt><dd className="inline">{nft.network}</dd></div>
              <div><dt className="inline font-bold text-foreground">Coleção: </dt><dd className="inline">{nft.collectionName}</dd></div>
              <div><dt className="inline font-bold text-foreground">ID do NFT: </dt><dd className="inline">{nft.id}</dd></div>
            </dl>
          </div>
        ) : (
          <div className="grid gap-4 pt-5 text-sm lg:grid-cols-2">
            <div>
              <h3 className="mb-3 font-bold">Edições disponíveis</h3>
              <ul className="space-y-2 text-text-secondary">
                {nft.editions.map((edition) => (
                  <li key={edition.id}>
                    {edition.label} · {edition.priceEth} ETH · {edition.availableQuantity} disponíveis
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="mb-3 font-bold">Atributos</h3>
              <dl className="space-y-2 text-text-secondary">
                {Object.entries(nft.attributes).map(([key, value]) => (
                  <div key={key}><dt className="inline font-bold">{key}: </dt><dd className="inline">{value}</dd></div>
                ))}
              </dl>
            </div>
          </div>
        )}
      </section>

      {related.length > 0 && (
        <section aria-labelledby="colecao-relacionada-titulo">
          <h2 id="colecao-relacionada-titulo" className="mb-5 border-b border-primary/25 pb-3 text-lg font-bold text-primary">
            Mais desta coleção
          </h2>
          <ul className="grid grid-cols-2 gap-4 lg:grid-cols-5 lg:gap-6">
            {related.map((item) => <NftCard key={item.id} nft={item} />)}
          </ul>
        </section>
      )}
    </div>
  )
}
