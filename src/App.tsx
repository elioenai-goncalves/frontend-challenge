import { Button } from "@/components/ui/button";
import apeGreenJacket from "@/assets/images/nfts/ape-green-jacket.png";
import gorillaPurpleHoodie from "@/assets/images/nfts/gorilla-purple-hoodie.png";
import gorillaBeigeJacket from "@/assets/images/nfts/gorilla-beige-jacket.png";
import apeOrangeHeadphones from "@/assets/images/nfts/ape-orange-headphones.png";

const sampleImages = [
  { src: apeGreenJacket, alt: "Macaco marrom de óculos e jaqueta verde" },
  { src: gorillaPurpleHoodie, alt: "Gorila de chapéu verde e moletom roxo" },
  { src: gorillaBeigeJacket, alt: "Gorila escuro de jaqueta bege e gola verde" },
  { src: apeOrangeHeadphones, alt: "Macaco laranja com fones de ouvido" },
];

function App() {
  return (
    <main className="min-h-screen bg-background px-6 pt-10 pb-6 text-foreground lg:px-[120px] lg:py-6">
      <div className="mx-auto max-w-[1200px]">
        <section className="max-w-[600px]">
          <h1 className="font-heading text-display-mobile lg:text-display">
            <span className="lg:hidden">
              SEJA DONO DA CULTURA DIGITAL
            </span>

            <span className="hidden lg:inline">
              SEJA DONO DO FUTURO DA ARTE DIGITAL
            </span>
          </h1>

          <p className="mt-4 text-body-mobile text-text-secondary lg:text-body">
            <span className="lg:hidden">
              Descubra NFTs selecionados de criadores do mundo todo.
            </span>

            <span className="hidden lg:inline">
              Descubra NFTs selecionados de criadores emergentes e
              consagrados. Colecione arte digital rara, apoie artistas e
              tenha uma parte da cultura da internet.
            </span>
          </p>

          <div className="mt-6">
            <a
              href="#amostra-superficie"
              className="inline-flex items-center gap-2 text-action-mobile text-text-accent underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-text-accent lg:hidden"
            >
              EXPLORAR
              <span aria-hidden="true">→</span>
            </a>

            <section
              aria-label="Amostra de imagens"
              className="mt-8 grid max-w-[600px] grid-cols-2 gap-4 sm:grid-cols-4"
            >
              {sampleImages.map((image) => (
                <img
                  key={image.src}
                  src={image.src}
                  alt={image.alt}
                  className="aspect-square w-full object-cover"
                />
              ))}
            </section>

            <Button
              type="button"
              className="hidden h-10 min-w-[140px] gap-2.5 rounded-button py-2.5 pl-7 pr-9 font-sans text-[16px] leading-5 font-bold tracking-normal lg:inline-flex"
            >
              EXPLORAR
            </Button>
          </div>
        </section>

        <section
          id="amostra-superficie"
          className="mt-8 max-w-[310px] bg-card p-5 text-card-foreground"
        >
          <h2 className="font-bold">Coleções</h2>

          <p className="mt-4 text-body text-text-secondary">
            Amostra da superfície do painel de filtros.
          </p>
        </section>
      </div>
    </main>
  );
}

export default App;