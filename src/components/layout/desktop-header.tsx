import { Link, useRouterState } from '@tanstack/react-router'
import { LogIn, Search, ShoppingCart } from 'lucide-react'

interface DesktopHeaderProps {
  showDivider?: boolean
}

const focusClassName =
  'focus-visible:outline-2 focus-visible:outline-offset-4 ' +
  'focus-visible:outline-primary'

export function DesktopHeader({
  showDivider = true,
}: DesktopHeaderProps) {
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  })

  const isHome = pathname === '/'

  const isMarket =
    pathname.startsWith('/nfts/') ||
    pathname === '/cart' ||
    pathname === '/checkout'

  const navigationItemClassName =
    `relative inline-flex min-h-11 items-center text-sm ${focusClassName}`

  const activeClassName =
    'font-bold text-primary after:absolute after:inset-x-0 ' +
    'after:bottom-0 after:h-0.5 after:bg-primary'

  return (
    <header className="hidden px-6 pt-6 lg:block">
      <div
        className={[
          'mx-auto max-w-300',
          showDivider ? 'border-b-[0.3px] border-primary' : '',
        ].join(' ')}
      >
        <div className="flex min-h-11 items-center justify-between gap-6">
          <Link
            to="/"
            search={{}}
            aria-label="Kurio — início"
            className={`shrink-0 text-sm font-bold tracking-widest ${focusClassName}`}
          >
            KURIO
          </Link>

          <nav
            aria-label="Navegação principal"
            className="flex items-center gap-8"
          >
            <Link
              to="/"
              search={{}}
              aria-current={isHome ? 'page' : undefined}
              className={[
                navigationItemClassName,
                isHome ? activeClassName : 'text-foreground',
              ].join(' ')}
            >
              Início
            </Link>

            <Link
              to="/"
              search={{}}
              className={[
                navigationItemClassName,
                isMarket ? activeClassName : 'text-foreground',
              ].join(' ')}
            >
              Mercado
            </Link>

            <span
              aria-disabled="true"
              title="Página fora do escopo desta demonstração"
              className="cursor-not-allowed text-sm text-text-secondary"
            >
              Criadores
            </span>

            <span
              aria-disabled="true"
              title="Página fora do escopo desta demonstração"
              className="cursor-not-allowed text-sm text-text-secondary"
            >
              Aprenda
            </span>
          </nav>

          <div className="flex shrink-0 items-center gap-5">
            <Link
              to="/"
              search={{}}
              aria-label="Ir ao catálogo para buscar NFTs"
              className={`inline-flex size-9 items-center justify-center ${focusClassName}`}
            >
              <Search
                aria-hidden="true"
                size={20}
                strokeWidth={1.5}
              />
            </Link>

            <Link
              to="/cart"
              aria-label="Abrir carrinho"
              className={`inline-flex size-9 items-center justify-center ${focusClassName}`}
            >
              <ShoppingCart
                aria-hidden="true"
                size={20}
                strokeWidth={1.5}
              />
            </Link>

            <Link
              to="/login"
              search={{}}
              className={[
                'inline-flex min-h-9 items-center gap-2',
                'rounded-button bg-primary px-3',
                'text-sm font-bold text-primary-foreground',
                focusClassName,
              ].join(' ')}
            >
              <LogIn
                aria-hidden="true"
                size={18}
                strokeWidth={1.5}
              />

              Entrar
            </Link>
          </div>
        </div>
      </div>
    </header>
  )
}