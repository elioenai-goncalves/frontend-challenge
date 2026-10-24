import { Link } from '@tanstack/react-router'

const benefits = [
  {
    symbol: 'W',
    title: 'Segurança da carteira',
    description:
      'Proteja sua carteira e colecione arte digital com verificação e confiança.',
  },
  {
    symbol: 'C',
    title: 'Criadores em destaque',
    description:
      'Conheça artistas, estúdios e comunidades que moldam a cultura digital na rede.',
  },
  {
    symbol: 'D',
    title: 'Alertas de lançamentos',
    description:
      'Receba calendários de cunhagem, novidades de listas de acesso e análises do mercado.',
  },
]

const profileItems = [
  'Minha coleção',
  'Atividade',
  'Estúdio do criador',
  'Lista de interesse',
]

const helpItems = [
  'Central de ajuda',
  'Como comprar NFTs',
  'Carteira e segurança',
  'Política do mercado',
  'Denunciar item',
]

const collectionItems = [
  'Arte digital',
  'Fotografia',
  'Música',
  'Arte 3D',
  'Utilidade',
]

const socialItems = ['Facebook', 'Instagram', 'X', 'LinkedIn', 'YouTube']

const footerLinkClassName =
  'rounded underline-offset-4 hover:underline ' +
  'focus-visible:outline-2 focus-visible:outline-offset-4 ' +
  'focus-visible:outline-primary'

function UnavailableItem({ children }: { children: string }) {
  return (
    <span
      aria-disabled="true"
      title="Fora do escopo desta demonstração"
      className="cursor-not-allowed"
    >
      {children}
    </span>
  )
}

export function SiteFooter() {
  return (
    <footer
      aria-label="Rodapé institucional"
      className="hidden px-6 pb-6 pt-12 lg:block"
    >
      <div className="mx-auto max-w-300 text-sm">
        <div className="bg-card px-8 py-8 text-card-foreground">
          <div className="grid grid-cols-4">
            {benefits.map((benefit) => (
              <section
                key={benefit.title}
                className="min-w-0 border-r border-primary/40 px-4 first:pl-0"
              >
                <div
                  aria-hidden="true"
                  className="flex size-16 items-center justify-center rounded-full bg-primary text-xl font-bold text-primary-foreground"
                >
                  {benefit.symbol}
                </div>

                <h2 className="mt-4 font-bold">
                  {benefit.title}
                </h2>

                <p className="mt-3 text-xs leading-6 text-text-secondary">
                  {benefit.description}
                </p>
              </section>
            ))}

            <section
              aria-labelledby="footer-newsletter-title"
              className="min-w-0 pl-4"
            >
              <h2
                id="footer-newsletter-title"
                className="font-bold"
              >
                Antecipe-se ao próximo lançamento
              </h2>

              <label
                htmlFor="footer-newsletter-email"
                className="sr-only"
              >
                E-mail para receber novidades
              </label>

              <div className="mt-4 flex min-w-0">
                <input
                  id="footer-newsletter-email"
                  type="email"
                  placeholder="Digite seu e-mail..."
                  disabled
                  aria-describedby="footer-newsletter-note"
                  className="min-w-0 flex-1 rounded-l border border-primary/30 bg-background px-3 py-2 text-xs placeholder:text-text-secondary disabled:cursor-not-allowed"
                />

                <button
                  type="button"
                  disabled
                  className="shrink-0 rounded-r bg-primary px-3 py-2 font-bold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Enviar
                </button>
              </div>

              <p className="mt-3 text-xs leading-6 text-text-secondary">
                Receba lançamentos selecionados, histórias de
                criadores e novidades do mercado.
              </p>

              <p
                id="footer-newsletter-note"
                className="mt-2 text-xs leading-5 text-text-secondary"
              >
                Inscrição indisponível nesta demonstração.
              </p>
            </section>
          </div>
        </div>

        <div className="grid grid-cols-4 items-center gap-6 bg-primary/15 px-8 py-6 text-xs">
          <Link
            to="/"
            search={{}}
            className={`w-fit font-bold tracking-widest ${footerLinkClassName}`}
          >
            KURIO
          </Link>

          <p className="leading-5">
            Feito para colecionadores, criadores e cultura
          </p>

          <p className="wrap-break-words">contato@email.com</p>

          <p>+55 11 4002 8922</p>
        </div>

        <div className="grid grid-cols-4 gap-6 bg-card px-8 py-8 text-card-foreground">
          <section aria-labelledby="footer-profile-title">
            <h2
              id="footer-profile-title"
              className="font-bold"
            >
              Meu perfil
            </h2>

            <ul className="mt-3 space-y-3 text-xs">
              <li>
                <Link
                  to="/profile"
                  className={footerLinkClassName}
                >
                  Meu perfil
                </Link>
              </li>

              {profileItems.map((item) => (
                <li key={item}>
                  <UnavailableItem>{item}</UnavailableItem>
                </li>
              ))}
            </ul>
          </section>

          <section aria-labelledby="footer-help-title">
            <h2 id="footer-help-title" className="font-bold">
              Central de ajuda
            </h2>

            <ul className="mt-3 space-y-3 text-xs">
              {helpItems.map((item) => (
                <li key={item}>
                  <UnavailableItem>{item}</UnavailableItem>
                </li>
              ))}
            </ul>
          </section>

          <section aria-labelledby="footer-collections-title">
            <h2
              id="footer-collections-title"
              className="font-bold"
            >
              Coleções
            </h2>

            <ul className="mt-3 space-y-3 text-xs">
              {collectionItems.map((item) => (
                <li key={item}>
                  <UnavailableItem>{item}</UnavailableItem>
                </li>
              ))}
            </ul>
          </section>

          <div>
            <section aria-labelledby="footer-social-title">
              <h2
                id="footer-social-title"
                className="font-bold"
              >
                Redes sociais
              </h2>

              <ul className="mt-3 flex flex-wrap gap-x-3 gap-y-2 text-xs">
                {socialItems.map((item) => (
                  <li key={item}>
                    <UnavailableItem>{item}</UnavailableItem>
                  </li>
                ))}
              </ul>
            </section>

            <section
              aria-labelledby="footer-wallets-title"
              className="mt-6"
            >
              <h2
                id="footer-wallets-title"
                className="font-bold"
              >
                Carteiras compatíveis
              </h2>

              <p className="mt-3 rounded border border-primary/40 px-2 py-2 text-xs text-primary">
                MetaMask · WalletConnect · Coinbase
              </p>

              <p className="mt-2 text-xs leading-5 text-text-secondary">
                Integrações simuladas no desafio.
              </p>
            </section>
          </div>
        </div>

        <p className="py-4 text-center text-xs text-text-secondary">
          © 2026 Kurio. Propriedade digital para todos.
        </p>
      </div>
    </footer>
  )
}