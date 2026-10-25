import { useState, type FormEvent } from 'react'
import { Link, useSearch } from '@tanstack/react-router'

import { EmptyState } from '@/components/empty-state'
import { ErrorState } from '@/components/error-state'
import { LoadingSkeleton } from '@/components/ui/loading-skeleton'
import { TextField } from '@/components/ui/text-field'

import type {
  CartResponse,
  Network,
  QuoteResponse,
} from '@/contracts/api'

import { useCart } from '@/hooks/use-cart'
import { useQuote } from '@/hooks/use-quote'
import { useWallets } from '@/hooks/use-wallets'
import { getApiErrorMessage } from '@/lib/api-client'
import { useSession } from '@/lib/session'

const NETWORKS: { value: Network; label: string }[] = [
  { value: 'ethereum', label: 'Ethereum' },
  { value: 'polygon', label: 'Polygon' },
  { value: 'solana', label: 'Solana' },
]

function CheckoutSkeleton() {
  return (
    <div
      role="status"
      aria-label="Carregando pagamento"
      className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem]"
    >
      <span className="sr-only">
        Carregando dados do pagamento...
      </span>

      <div className="space-y-4">
        <LoadingSkeleton className="h-16 w-full" />
        <LoadingSkeleton className="h-16 w-full" />
        <LoadingSkeleton className="h-32 w-full" />
      </div>

      <LoadingSkeleton className="h-64 w-full" />
    </div>
  )
}

function QuoteReview({ quote }: { quote: QuoteResponse }) {
  return (
    <div className="space-y-4 text-sm">
      <h3 className="font-semibold">Itens da compra</h3>

      <ul className="space-y-3">
        {quote.items.map((item) => (
          <li
            key={`${item.nftId}-${item.editionId}`}
            className="border-b border-border pb-3"
          >
            <p className="font-medium">{item.nftName}</p>
            <p className="mt-1 text-text-secondary">
              {item.editionLabel} · {item.quantity} unidade(s)
            </p>
            <p className="mt-1">{item.lineTotalEth} ETH</p>
          </li>
        ))}
      </ul>

      <dl className="space-y-3">
        <div className="flex justify-between gap-4">
          <dt>Subtotal</dt>
          <dd>{quote.subtotalEth} ETH</dd>
        </div>

        <div className="flex justify-between gap-4">
          <dt>Desconto</dt>
          <dd>{quote.discountEth} ETH</dd>
        </div>

        <div className="flex justify-between gap-4">
          <dt>Taxa de rede</dt>
          <dd>{quote.networkFeeEth} ETH</dd>
        </div>

        <div className="flex justify-between gap-4 border-t border-border pt-4 font-bold">
          <dt>Total</dt>
          <dd className="text-primary">{quote.totalEth} ETH</dd>
        </div>
      </dl>

      <p className="text-xs text-text-secondary">
        {quote.couponCode
          ? `Cupom aplicado: ${quote.couponCode}`
          : 'Nenhum cupom aplicado'}
      </p>
    </div>
  )
}

interface CheckoutContentProps {
  cart: CartResponse
  userId: string
  userName: string
  userEmail: string
  initialNetwork: Network
  couponCode: string | null
}

function CheckoutContent({
  cart,
  userId,
  userName,
  userEmail,
  initialNetwork,
  couponCode,
}: CheckoutContentProps) {
  const [network, setNetwork] = useState(initialNetwork)
  const [walletId, setWalletId] = useState('')
  const [connectedWalletId, setConnectedWalletId] =
    useState<string | null>(null)

  const [name, setName] = useState(userName)
  const [email, setEmail] = useState(userEmail)

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [reviewMessage, setReviewMessage] = useState<string | null>(null)
  const [reviewError, setReviewError] = useState<string | null>(null)
  const [reviewing, setReviewing] = useState(false)

  const wallets = useWallets(userId)
  const quote = useQuote(userId, cart, network, couponCode)

  const availableWallets =
    wallets.data?.items.filter(
      (wallet) => wallet.network === network,
    ) ?? []

  const selectedWallet =
    availableWallets.find((wallet) => wallet.id === walletId) ??
    null

  const isConnected =
    selectedWallet !== null &&
    selectedWallet.id === connectedWalletId

  function changeNetwork(next: Network) {
    setNetwork(next)
    setWalletId('')
    setConnectedWalletId(null)
    setErrors({})
    setReviewMessage(null)
    setReviewError(null)
  }

  function validateFields() {
    const nextErrors: Record<string, string> = {}

    if (name.trim().length < 2) {
      nextErrors.name = 'Informe o nome do colecionador.'
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      nextErrors.email = 'Informe um e-mail válido.'
    }

    if (!selectedWallet) {
      nextErrors.walletId = 'Selecione uma carteira nesta rede.'
    } else if (!isConnected) {
      nextErrors.walletId =
        'Conecte a carteira selecionada para continuar.'
    }

    return nextErrors
  }

  function quotationChanged(
    previous: QuoteResponse,
    current: QuoteResponse,
  ) {
    return (
      previous.cartId !== current.cartId ||
      previous.cartVersion !== current.cartVersion ||
      previous.network !== current.network ||
      previous.couponCode !== current.couponCode ||
      previous.subtotalEth !== current.subtotalEth ||
      previous.discountEth !== current.discountEth ||
      previous.networkFeeEth !== current.networkFeeEth ||
      previous.totalEth !== current.totalEth ||
      JSON.stringify(previous.items) !==
        JSON.stringify(current.items)
    )
  }

  async function handleReview(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const nextErrors = validateFields()
    setErrors(nextErrors)
    setReviewMessage(null)
    setReviewError(null)

    if (Object.keys(nextErrors).length > 0) return
    if (!quote.data || reviewing || quote.isFetching) return

    setReviewing(true)

    try {
      const previous = quote.data

      // Solicita uma NOVA cotação à API, mesmo que
      // a cotação anterior ainda esteja em cache.
      const result = await quote.refetch()

      if (result.isError || !result.data) {
        setReviewError(
          getApiErrorMessage(result.error),
        )
        return
      }

      if (
        result.data.cartId !== cart.id ||
        result.data.cartVersion !== cart.version
      ) {
        setReviewError(
          'O carrinho mudou. Volte ao carrinho e revise os itens.',
        )
        return
      }

      if (quotationChanged(previous, result.data)) {
        setReviewMessage(
          'A cotação mudou. Revise os novos valores antes de confirmar a compra.',
        )
      } else {
        setReviewMessage(
          'Cotação revalidada. Os valores estão atualizados.',
        )
      }
    } catch (error) {
      setReviewError(getApiErrorMessage(error))
    } finally {
      setReviewing(false)
    }
  }

  return (
    <form onSubmit={(event) => void handleReview(event)} noValidate>
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="space-y-8">
          <section className="rounded-lg border border-border bg-card p-6">
            <h2 className="mb-5 text-xl font-bold">
              Dados do colecionador
            </h2>

            <div className="space-y-4">
              <TextField
                label="Nome completo"
                name="collectorName"
                autoComplete="name"
                value={name}
                onChange={(event) => {
                  setName(event.currentTarget.value)
                  setErrors((previous) => ({
                    ...previous,
                    name: '',
                  }))
                  setReviewMessage(null)
                }}
                error={errors.name}
              />

              <TextField
                label="E-mail"
                name="collectorEmail"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => {
                  setEmail(event.currentTarget.value)
                  setErrors((previous) => ({
                    ...previous,
                    email: '',
                  }))
                  setReviewMessage(null)
                }}
                error={errors.email}
              />
            </div>
          </section>

          <section className="rounded-lg border border-border bg-card p-6">
            <h2 className="mb-5 text-xl font-bold">
              Carteira e rede
            </h2>

            <label
              htmlFor="checkout-network"
              className="mb-2 block text-sm font-semibold"
            >
              Rede
            </label>

            <select
              id="checkout-network"
              value={network}
              onChange={(event) =>
                changeNetwork(event.currentTarget.value as Network)
              }
              disabled={reviewing}
              className="h-11 w-full rounded-md border border-border bg-background px-3"
            >
              {NETWORKS.map((entry) => (
                <option key={entry.value} value={entry.value}>
                  {entry.label}
                </option>
              ))}
            </select>

            {wallets.isPending ? (
              <LoadingSkeleton className="mt-5 h-11 w-full" />
            ) : wallets.isError ? (
              <div role="alert" className="mt-5 text-sm text-destructive">
                <p>{getApiErrorMessage(wallets.error)}</p>
                <button
                  type="button"
                  onClick={() => void wallets.refetch()}
                  className="mt-2 underline underline-offset-4"
                >
                  Tentar novamente
                </button>
              </div>
            ) : (
              <div className="mt-5">
                <label
                  htmlFor="checkout-wallet"
                  className="mb-2 block text-sm font-semibold"
                >
                  Carteira cadastrada
                </label>

                <select
                  id="checkout-wallet"
                  value={walletId}
                  disabled={
                    reviewing || availableWallets.length === 0
                  }
                  onChange={(event) => {
                    setWalletId(event.currentTarget.value)
                    setConnectedWalletId(null)
                    setReviewMessage(null)
                    setErrors((previous) => ({
                      ...previous,
                      walletId: '',
                    }))
                  }}
                  aria-invalid={Boolean(errors.walletId)}
                  className="h-11 w-full rounded-md border border-border bg-background px-3"
                >
                  <option value="">Selecione uma carteira</option>

                  {availableWallets.map((wallet) => (
                    <option key={wallet.id} value={wallet.id}>
                      {wallet.label} — {wallet.address.slice(0, 10)}...
                    </option>
                  ))}
                </select>

                {availableWallets.length === 0 && (
                  <p className="mt-3 text-sm text-text-secondary">
                    Não há carteiras cadastradas para esta rede.
                    O cadastro e gerenciamento de carteiras
                    será ampliado na Issue #21.
                  </p>
                )}

                {errors.walletId && (
                  <p
                    role="alert"
                    className="mt-2 text-sm text-destructive"
                  >
                    {errors.walletId}
                  </p>
                )}

                {selectedWallet && (
                  <div className="mt-4">
                    <p className="mb-3 text-sm text-text-secondary">
                      {isConnected
                        ? 'Carteira conectada na simulação.'
                        : 'Carteira ainda não conectada.'}
                    </p>

                    <button
                      type="button"
                      disabled={reviewing}
                      onClick={() => {
                        setConnectedWalletId(
                          isConnected ? null : selectedWallet.id,
                        )
                        setReviewMessage(null)
                      }}
                      className="min-h-11 rounded-md border border-primary px-4 text-sm text-primary"
                    >
                      {isConnected
                        ? 'Desconectar carteira'
                        : 'Simular conexão da carteira'}
                    </button>
                  </div>
                )}
              </div>
            )}
          </section>
        </div>

        <aside
          aria-label="Revisão do pagamento"
          className="h-fit rounded-lg border border-border bg-card p-6"
        >
          <h2 className="mb-5 text-xl font-bold">
            Revisão da compra
          </h2>

          {quote.isPending ? (
            <div
              role="status"
              aria-label="Carregando cotação"
              className="space-y-4"
            >
              <LoadingSkeleton className="h-6 w-full" />
              <LoadingSkeleton className="h-6 w-full" />
              <LoadingSkeleton className="h-6 w-full" />
              <LoadingSkeleton className="h-10 w-full" />
            </div>
          ) : quote.isError ? (
            <div role="alert" className="text-sm text-destructive">
              <p>{getApiErrorMessage(quote.error)}</p>

              <button
                type="button"
                onClick={() => void quote.refetch()}
                disabled={quote.isFetching}
                className="mt-3 underline underline-offset-4"
              >
                Tentar novamente
              </button>
            </div>
          ) : quote.data ? (
            <QuoteReview quote={quote.data} />
          ) : (
            <p className="text-text-secondary">
              Cotação indisponível.
            </p>
          )}

          <button
            type="submit"
            disabled={
              reviewing ||
              quote.isPending ||
              quote.isFetching ||
              quote.isError ||
              !quote.data ||
              wallets.isPending ||
              wallets.isError
            }
            aria-busy={reviewing}
            className="mt-6 min-h-11 w-full rounded-md bg-primary px-4 font-bold text-primary-foreground disabled:opacity-50"
          >
            {reviewing
              ? 'Revalidando...'
              : 'Revalidar e revisar compra'}
          </button>

          {reviewMessage && (
            <p
              role="status"
              className="mt-4 text-sm text-primary"
            >
              {reviewMessage}
            </p>
          )}

          {reviewError && (
            <p
              role="alert"
              className="mt-4 text-sm text-destructive"
            >
              {reviewError}
            </p>
          )}

          <p className="mt-5 text-xs leading-relaxed text-text-secondary">
            Esta etapa revisa os dados e revalida a cotação.
            Nenhum pedido será criado ainda.
          </p>

          <Link
            to="/cart"
            className="mt-5 inline-block text-sm text-primary underline underline-offset-4"
          >
            Voltar ao carrinho
          </Link>
        </aside>
      </div>
    </form>
  )
}

export function CheckoutPage() {
  const search = useSearch({ from: '/checkout' })
  const session = useSession()
  const userId = session.user?.id ?? null

  const cart = useCart(userId)

  if (session.status !== 'authenticated') {
    return (
      <p role="status">
        Autenticação necessária para continuar.
      </p>
    )
  }

  if (cart.isPending) {
    return (
      <section>
        <h1 className="mb-8 text-3xl font-bold">Pagamento</h1>
        <CheckoutSkeleton />
      </section>
    )
  }

  if (cart.isError) {
    return (
      <ErrorState
        description={getApiErrorMessage(cart.error)}
        onRetry={() => void cart.refetch()}
        isRetrying={cart.isFetching}
      />
    )
  }

  if (!cart.data || cart.data.items.length === 0) {
    return (
      <div className="space-y-5">
        <EmptyState
          title="Carrinho vazio"
          description="Adicione NFTs ao carrinho antes de iniciar o pagamento."
        />

        <Link
          to="/cart"
          className="text-primary underline underline-offset-4"
        >
          Voltar ao carrinho
        </Link>
      </div>
    )
  }

  return (
    <section aria-labelledby="checkout-title">
      <h1
        id="checkout-title"
        className="mb-8 text-3xl font-bold"
      >
        Pagamento
      </h1>

      <CheckoutContent
        key={`${session.user.id}-${cart.data.id}`}
        cart={cart.data}
        userId={session.user.id}
        userName={session.user.name}
        userEmail={session.user.email}
        initialNetwork={search.network}
        couponCode={search.couponCode ?? null}
      />
    </section>
  )
}