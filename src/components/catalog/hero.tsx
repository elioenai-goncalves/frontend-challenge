import heroImage from '@/assets/images/nfts/ape-green-jacket.png'

export function Hero() {
  return (
    <section aria-labelledby="hero-title" className="grid items-center gap-8 lg:grid-cols-2">
      <div>
        <p className="text-xs lg:text-sm">Bem-vindo à Kurio</p>

        <h1
          id="hero-title"
          className="mt-4 text-[18px] leading-7.25 font-bold lg:text-[43px] lg:leading-17.5"
        >
          SEJA DONO DO FUTURO DA ARTE DIGITAL
        </h1>

        <p className="mt-4 max-w-md text-xs leading-4.5 text-text-secondary lg:text-sm lg:leading-6">
          Descubra NFTs selecionados de criadores independentes, com arte digital verificada.
        </p>

        <a
          href="#catalogo"
          className="mt-6 inline-flex items-center gap-1 font-bold text-primary focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary lg:h-10 lg:min-w-35 lg:justify-center lg:rounded-button lg:bg-primary lg:px-9 lg:text-primary-foreground"
        >
          EXPLORAR
          <span aria-hidden="true" className="lg:hidden">
            →
          </span>
        </a>
      </div>

      <img
        src={heroImage}
        alt="Macaco de óculos escuros e jaqueta verde, arte em destaque da coleção"
        width={560}
        height={560}
        className="aspect-square w-full rounded-lg object-cover"
      />
    </section>
  )
}