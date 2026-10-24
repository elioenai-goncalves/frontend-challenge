import {
  createRootRoute,
  createRoute,
  createRouter,
  redirect,
} from '@tanstack/react-router'

import {
  hasDevSession,
  validateLoginSearch,
} from '@/lib/dev-session'

import { RouteLayout } from '@/components/route-layout'

import { validateCatalogSearch } from '@/lib/catalog-search'

import {
  CartPage,
  CheckoutPage,
  HomePage,
  LoginPage,
  NftDetailsPage,
  NotFoundPage,
  OrderConfirmationPage,
  ProfilePage,
  RegisterPage,
  WalletsPage,
} from '@/pages/route-pages'

function requireSession({
  location,
}: {
  location: { href: string }
}) {
  if (!hasDevSession()) {
    throw redirect({
      to: '/login',
      search: {
        redirect: location.href,
      },
      replace: true,
    })
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
  component: LoginPage,
})

const registerRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/register',
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

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}