import { createRootRoute, createRoute, createRouter, redirect } from '@tanstack/react-router'

import { RouteLayout } from '@/components/route-layout'
import { setSessionExpiredHandler } from '@/lib/api-client'
import { validateCatalogSearch } from '@/lib/catalog-search'
import { validateLoginSearch } from '@/lib/login-search'
import { endSession, getSession, initSession } from '@/lib/session'
import { HomePage } from '@/pages/home-page'

import { LoginPage } from '@/pages/login-page'
import { RegisterPage } from '@/pages/register-page'
import {
  CartPage,
  CheckoutPage,
  NftDetailsPage,
  NotFoundPage,
  OrderConfirmationPage,
  ProfilePage,
  WalletsPage,
} from '@/pages/route-pages'

async function requireSession({ location }: { location: { href: string } }) {
  await initSession()

  if (getSession().status !== 'authenticated') {
    throw redirect({
      to: '/login',
      search: { redirect: location.href },
      replace: true,
    })
  }
}

async function redirectIfAuthenticated() {
  await initSession()

  if (getSession().status === 'authenticated') {
    throw redirect({ to: '/', search: {}, replace: true })
  }
}

const rootRoute = createRootRoute({
  component: RouteLayout,
  notFoundComponent: NotFoundPage,
})

const homeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  validateSearch: validateCatalogSearch,
  component: HomePage,
})

const nftDetailsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/nfts/$nftId',
  component: NftDetailsPage,
})

const cartRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/cart',
  component: CartPage,
})

const checkoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/checkout',
  beforeLoad: requireSession,
  component: CheckoutPage,
})

const orderConfirmationRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/orders/$orderId/confirmation',
  beforeLoad: requireSession,
  component: OrderConfirmationPage,
})

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/login',
  validateSearch: validateLoginSearch,
  beforeLoad: redirectIfAuthenticated,
  component: LoginPage,
})

const registerRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/register',
  validateSearch: validateLoginSearch,
  beforeLoad: redirectIfAuthenticated,
  component: RegisterPage,
})

const profileRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/profile',
  beforeLoad: requireSession,
  component: ProfilePage,
})

const walletsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/wallets',
  beforeLoad: requireSession,
  component: WalletsPage,
})

const routeTree = rootRoute.addChildren([
  homeRoute,
  nftDetailsRoute,
  cartRoute,
  checkoutRoute,
  orderConfirmationRoute,
  loginRoute,
  registerRoute,
  profileRoute,
  walletsRoute,
])

export const router = createRouter({
  routeTree,
})

const PRIVATE_PATH = /^\/(checkout|profile|wallets)(\/|$)|^\/orders\//

// Sessão expirada em qualquer chamada autenticada: em rota privada, volta ao
// login guardando o destino; em rota pública, apenas encerra a sessão.
setSessionExpiredHandler(() => {
  if (getSession().status !== 'authenticated') return

  const { href, pathname } = router.state.location
  endSession()

  if (PRIVATE_PATH.test(pathname)) {
    void router.navigate({ to: '/login', search: { redirect: href }, replace: true })
  }
})

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}