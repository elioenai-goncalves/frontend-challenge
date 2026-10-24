import {
  Link,
  Outlet,
  useRouter,
} from '@tanstack/react-router'

import { endDevSession } from '@/lib/dev-session'

const linkClassName =
  'rounded px-2 py-1 underline-offset-4 hover:underline ' +
  'focus-visible:outline-2 focus-visible:outline-offset-4 ' +
  'focus-visible:outline-primary'

export function RouteLayout() {
    const router = useRouter()

    async function handleEndDevSession() {
    endDevSession()

    await router.invalidate()

    await router.navigate({
        to: '/login',
        search: {},
        replace: true,
    })
    }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border">
        <nav
          aria-label="Navegação provisória"
          className="mx-auto flex max-w-300 flex-wrap gap-4 px-6 py-6"
        >
          <Link to="/" className={linkClassName}>
            Início
          </Link>

          <Link to="/cart" className={linkClassName}>
            Carrinho
          </Link>

          <Link to="/checkout" className={linkClassName}>
            Pagamento
          </Link>

          <Link to="/login" className={linkClassName}>
            Login
          </Link>

          <Link to="/register" className={linkClassName}>
            Cadastro
          </Link>

          <Link to="/profile" className={linkClassName}>
            Perfil
          </Link>

          <Link to="/wallets" className={linkClassName}>
            Carteiras
          </Link>
          {import.meta.env.DEV && (
            <button
                type="button"
                onClick={handleEndDevSession}
                className={linkClassName}
            >
                Encerrar sessão de teste
            </button>
            )}
        </nav>
      </header>

      <main className="mx-auto max-w-300 px-6 py-12">
        <Outlet />
      </main>
    </div>
  )
}