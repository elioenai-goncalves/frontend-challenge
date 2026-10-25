
import { Link } from '@tanstack/react-router'

import greenApe from '@/assets/images/nfts/ape-green-jacket.png'
import purpleApe from '@/assets/images/nfts/gorilla-purple-hoodie.png'
import beigeGorilla from '@/assets/images/nfts/gorilla-beige-jacket.png'
import orangeApe from '@/assets/images/nfts/ape-orange-headphones.png'

const articles = [
  {
    title: 'Como funciona a propriedade de NFTs',
    date: '12 de setembro',
    reading: '6 min',
    image: beigeGorilla,
    intro: 'Aprenda a colecionar, negociar e verificar ativos digitais.',
    details:
      'NFTs utilizam identificadores únicos para registrar ativos digitais. Antes de comprar, confira a rede, o contrato e a procedência.',
  },
  {
    title: '10 artistas digitais para acompanhar',
    date: '13 de setembro',
    reading: '2 min',
    image: greenApe,
    intro: 'Conheça criadores que moldam a cultura digital.',
    details:
      'Acompanhe novas coleções, processos criativos e lançamentos para descobrir artistas e projetos independentes.',
  },
  {
    title: 'Raridade, atributos e procedência',
    date: '15 de setembro',
    reading: '3 min',
    image: purpleApe,
    intro: 'Entenda raridade, procedência, direitos autorais e utilidade.',
    details:
      'Compare edições, atributos e disponibilidade. A raridade não substitui a verificação dos dados da coleção.',
  },
  {
    title: 'Como proteger sua carteira',
    date: '15 de setembro',
    reading: '2 min',
    image: orangeApe,
    intro: 'Proteja sua carteira, seus ativos e sua identidade.',
    details:
      'Nunca compartilhe sua frase de recuperação. Verifique os endereços e as permissões antes de autorizar operações.',
  },
]

export function SidebarFeatured() {
  return (
    <section
      aria-labelledby="nft-lateral-titulo"
      className="bg-card p-4 text-center"
    >
      <h2
        id="nft-lateral-titulo"
        className="text-lg font-bold text-primary"
      >
        NFT EM DESTAQUE
      </h2>

      <p className="mt-2 font-bold">
        OFERTA LIMITADA
      </p>

      <Link
        to="/nfts/$nftId"
        params={{ nftId: 'nft-02' }}
        className="mt-3 block rounded-lg focus-visible:outline-2 focus-visible:outline-primary"
      >
        <img
          src={purpleApe}
          alt="Gorila de moletom roxo"
          width={320}
          height={320}
          loading="lazy"
          className="aspect-square w-full rounded-xl object-cover"
        />
        <span className="mt-3 inline-block text-sm font-bold text-primary">
          Ver NFT em destaque →
        </span>
      </Link>
    </section>
  )
}

export function HomeEditorial() {
  return (
    <div className="hidden space-y-20 lg:block">
      <section
        aria-label="Seleções especiais"
        className="grid grid-cols-2 gap-6"
      >
        <article className="grid min-h-52 grid-cols-2 overflow-hidden rounded-lg bg-card">
          <img
            src={greenApe}
            alt="Macaco de jaqueta verde"
            width={300}
            height={300}
            loading="lazy"
            className="h-full w-full object-cover"
          />

          <div className="flex flex-col items-end justify-center p-5 text-right">
            <h2 className="text-base font-bold">
              Lançamentos gênesis de edição limitada
            </h2>

            <p className="mt-3 text-xs leading-5 text-text-secondary">
              Colecione edições escassas diretamente dos criadores
              antes da revelação pública.
            </p>

            <a
              href="#catalogo"
              className="mt-3 rounded-md bg-primary px-5 py-2 text-xs font-bold text-primary-foreground"
            >
              Explorar →
            </a>
          </div>
        </article>

        <article className="grid min-h-52 grid-cols-2 overflow-hidden rounded-lg bg-card">
          <img
            src={beigeGorilla}
            alt="Gorila com jaqueta bege"
            width={300}
            height={300}
            loading="lazy"
            className="h-full w-full object-cover"
          />

          <div className="flex flex-col items-end justify-center p-5 text-right">
            <h2 className="text-base font-bold">
              Arte digital selecionada e muito mais
            </h2>

            <p className="mt-3 text-xs leading-5 text-text-secondary">
              Explore novos artistas, coleções verificadas
              e obras digitais que definem a comunidade.
            </p>

            <a
              href="#catalogo"
              className="mt-3 rounded-md bg-primary px-5 py-2 text-xs font-bold text-primary-foreground"
            >
              Explorar →
            </a>
          </div>
        </article>
      </section>

      <section aria-labelledby="diario-titulo">
        <div className="mb-10 text-center">
          <h2
            id="diario-titulo"
            className="text-2xl font-bold"
          >
            Diário da Cunhagem
          </h2>

          <p className="mt-3 text-sm text-text-secondary">
            Histórias, guias e insights para colecionadores
            sobre o universo da propriedade digital.
          </p>
        </div>

        <div className="grid grid-cols-4 gap-6">
          {articles.map((article) => (
            <article
              key={article.title}
              className="min-w-0 overflow-hidden rounded-lg bg-card"
            >
              <img
                src={article.image}
                alt=""
                width={300}
                height={220}
                loading="lazy"
                className="aspect-4/3 w-full object-cover"
              />

              <div className="p-4">
                <p className="text-xs text-text-secondary">
                  {article.date} | Leitura de {article.reading}
                </p>

                <h3 className="mt-3 text-sm font-bold leading-6">
                  {article.title}
                </h3>

                <p className="mt-2 text-xs leading-5 text-text-secondary">
                  {article.intro}
                </p>

                <details className="mt-2">
                  <summary className="cursor-pointer text-xs font-bold text-primary">
                    Ler mais →
                  </summary>

                  <p className="mt-3 text-xs leading-5 text-text-secondary">
                    {article.details}
                  </p>
                </details>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  )
}
