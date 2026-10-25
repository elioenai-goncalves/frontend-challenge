
import heroImage from '@/assets/images/nfts/ape-green-jacket.png'

export function Hero() {
  return (
    <section
      aria-labelledby="hero-title"
      className="
        relative min-h-56.25 overflow-hidden
        rounded-[32px] bg-card p-4
        lg:grid lg:min-h-112.5
        lg:grid-cols-[minmax(0,1fr)_450px]
        lg:items-center lg:gap-10
        lg:overflow-visible lg:rounded-none
        lg:bg-transparent lg:p-0
      "
    >
      <div className="relative z-10 w-[60%] lg:w-full">
        <p className="text-[11px] lg:text-sm">
          Bem-vindo à Kurio
        </p>

        <h1
          id="hero-title"
          className="
            mt-3 text-[18px] leading-[1.45] font-bold
            lg:mt-4 lg:text-[43px] lg:leading-[1.6]
          "
        >
          <span className="lg:hidden">
            SEJA DONO DA CULTURA DIGITAL
          </span>

          <span className="hidden lg:block">
            SEJA DONO DO FUTURO
            <span className="block">DA ARTE DIGITAL</span>
          </span>
        </h1>

        <p
          className="
            mt-2 text-[11px] leading-normal
            text-text-secondary
            lg:mt-4 lg:max-w-137.5
            lg:text-sm lg:leading-6
          "
        >
          <span className="lg:hidden">
            Descubra NFTs selecionados de criadores
            do mundo todo.
          </span>

          <span className="hidden lg:inline">
            Descubra NFTs selecionados de criadores
            emergentes e consagrados. Colecione arte
            digital rara, apoie artistas e tenha uma
            parte da cultura da internet.
          </span>
        </p>

        <a
          href="#catalogo"
          className="
            mt-3 inline-flex items-center gap-1
            text-xs font-bold text-primary
            focus-visible:outline-2
            focus-visible:outline-primary
            lg:mt-6 lg:h-10 lg:min-w-35
            lg:justify-center lg:rounded-button
            lg:bg-primary lg:px-9
            lg:text-sm lg:text-primary-foreground
          "
        >
          EXPLORAR
          <span aria-hidden="true" className="lg:hidden">
            →
          </span>
        </a>
      </div>

      <img
        src={heroImage}
        alt="Macaco de óculos e jaqueta verde"
        width={560}
        height={560}
        className="
          absolute right-3 top-8
          h-38.75 w-[39%]
          rounded-2xl object-cover
          lg:static lg:aspect-square
          lg:h-auto lg:w-full lg:rounded-lg
        "
      />
    </section>
  )
}
