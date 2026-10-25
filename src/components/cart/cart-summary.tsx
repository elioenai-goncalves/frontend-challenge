import { useState, type FormEvent } from 'react'

import { LoadingSkeleton } from '@/components/ui/loading-skeleton'
import type {
  CartResponse,
  Network,
  QuoteResponse,
} from '@/contracts/api'

import {
  useQuote,
  useQuoteAction,
} from '@/hooks/use-quote'

import { getApiErrorMessage } from '@/lib/api-client'

interface CartSummaryProps {
  cart: CartResponse
  userId: string | null
  isCartUpdating: boolean
}

const NETWORKS: {
  value: Network
  label: string
}[] = [
  { value: 'ethereum', label: 'Ethereum' },
  { value: 'polygon', label: 'Polygon' },
  { value: 'solana', label: 'Solana' },
]

function QuoteValues({
  quote,
}: {
  quote: QuoteResponse
}) {
  return (
    <dl
      aria-label="Valores da cotação"
      className="mt-6 space-y-4 text-sm"
    >
      <div className="flex justify-between gap-3">
        <dt>Subtotal</dt>
        <dd className="text-right font-semibold">
          {quote.subtotalEth} ETH
        </dd>
      </div>

      <div className="flex justify-between gap-3">
        <dt>Desconto</dt>
        <dd className="text-right font-semibold">
          {quote.discountEth} ETH
        </dd>
      </div>

      <div className="flex justify-between gap-3">
        <dt>Taxa de rede</dt>
        <dd className="text-right font-semibold">
          {quote.networkFeeEth} ETH
        </dd>
      </div>

      <div className="flex justify-between gap-3 border-t border-border pt-4">
        <dt className="font-bold">Total</dt>
        <dd className="text-right font-bold text-primary">
          {quote.totalEth} ETH
        </dd>
      </div>
    </dl>
  )
}

export function CartSummary({
  cart,
  userId,
  isCartUpdating,
}: CartSummaryProps) {
  const [network, setNetwork] =
    useState<Network>('ethereum')

  const [couponInput, setCouponInput] =
    useState('')

  const [appliedCoupon, setAppliedCoupon] =
    useState<string | null>(null)

  const [formError, setFormError] =
    useState<string | null>(null)

  const quote = useQuote(
    userId,
    cart,
    network,
    appliedCoupon,
  )

  const quoteAction = useQuoteAction(userId)

  const isBusy =
    isCartUpdating ||
    quote.isPending ||
    quoteAction.isPending

  function requestCoupon(couponCode?: string) {
    setFormError(null)
    quoteAction.reset()

    quoteAction.mutate(
      {
        network,
        ...(couponCode ? { couponCode } : {}),
      },
      {
        onSuccess: (result) => {
          // Se o carrinho mudou enquanto a API respondia,
          // não aplicamos uma cotação de versão antiga.
          if (
            result.cartId !== cart.id ||
            result.cartVersion !== cart.version ||
            result.network !== network
          ) {
            setFormError(
              'O carrinho mudou. Revise e tente novamente.',
            )
            return
          }

          setAppliedCoupon(result.couponCode)
          setCouponInput('')
        },
      },
    )
  }

  function handleApply(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (isBusy || quote.isError) return

    const code = couponInput.trim().toUpperCase()

    if (!code) {
      setFormError('Digite um cupom.')
      return
    }

    if (code === appliedCoupon) {
      setFormError('Este cupom já está aplicado.')
      return
    }

    requestCoupon(code)
  }

  return (
    <aside
      aria-label="Resumo do carrinho"
      className="h-fit rounded-lg border border-border bg-card p-6"
    >
      <h2 className="text-xl font-bold">
        Resumo do carrinho
      </h2>

      <div className="mt-6">
        <label
          htmlFor="quote-network"
          className="mb-2 block text-sm font-semibold"
        >
          Rede para cotação
        </label>

        <select
          id="quote-network"
          value={network}
          disabled={isBusy}
          onChange={(event) => {
            setNetwork(
              event.currentTarget.value as Network,
            )
            setFormError(null)
            quoteAction.reset()
          }}
          className="h-11 w-full rounded-md border border-border bg-background px-3 text-sm"
        >
          {NETWORKS.map((item) => (
            <option
              key={item.value}
              value={item.value}
            >
              {item.label}
            </option>
          ))}
        </select>
      </div>

      <form
        onSubmit={handleApply}
        className="mt-6"
      >
        <label
          htmlFor="cart-coupon"
          className="mb-2 block text-sm font-semibold"
        >
          Cupom de desconto
        </label>

        <div className="flex flex-wrap gap-2">
          <input
            id="cart-coupon"
            type="text"
            autoComplete="off"
            value={couponInput}
            disabled={isBusy}
            onChange={(event) => {
              setCouponInput(event.currentTarget.value)
              setFormError(null)
              quoteAction.reset()
            }}
            placeholder="Digite seu cupom"
            aria-invalid={
              Boolean(formError || quoteAction.isError)
            }
            aria-describedby="coupon-feedback"
            className="h-11 min-w-0 flex-1 rounded-md border border-border bg-background px-3 text-sm"
          />

          <button
            type="submit"
            disabled={isBusy || quote.isError}
            className="min-h-11 rounded-md bg-primary px-4 text-sm font-bold text-primary-foreground disabled:opacity-50"
          >
            Aplicar
          </button>
        </div>

        <div id="coupon-feedback">
          {appliedCoupon && (
            <div
              role="status"
              className="mt-3 text-sm text-primary"
            >
              <p>
                Cupom {appliedCoupon} aplicado.
              </p>

              <button
                type="button"
                disabled={isBusy}
                onClick={() => requestCoupon()}
                className="mt-2 underline underline-offset-4 disabled:opacity-50"
              >
                Remover cupom
              </button>
            </div>
          )}

          {formError && (
            <p
              role="alert"
              className="mt-3 text-sm text-destructive"
            >
              {formError}
            </p>
          )}

          {quoteAction.isError && (
            <p
              role="alert"
              className="mt-3 text-sm text-destructive"
            >
              {getApiErrorMessage(quoteAction.error)}
            </p>
          )}

          {quoteAction.isPending && (
            <p
              role="status"
              className="mt-3 text-sm text-text-secondary"
            >
              Validando cupom...
            </p>
          )}
        </div>
      </form>

      {isCartUpdating || quote.isPending ? (
        <div
          role="status"
          aria-label="Atualizando resumo"
          className="mt-6 space-y-4"
        >
          <span className="sr-only">
            Atualizando valores da cotação...
          </span>

          <LoadingSkeleton className="h-5 w-full" />
          <LoadingSkeleton className="h-5 w-full" />
          <LoadingSkeleton className="h-5 w-full" />
          <LoadingSkeleton className="h-8 w-full" />
        </div>
      ) : quote.isError ? (
        <div
          role="alert"
          className="mt-6 text-sm text-destructive"
        >
          <p>
            {getApiErrorMessage(quote.error)}
          </p>

          <button
            type="button"
            onClick={() => void quote.refetch()}
            disabled={quote.isFetching}
            className="mt-3 min-h-11 text-primary underline underline-offset-4 disabled:opacity-50"
          >
            {quote.isFetching
              ? 'Tentando novamente...'
              : 'Tentar novamente'}
          </button>
        </div>
      ) : quote.data ? (
        <QuoteValues quote={quote.data} />
      ) : (
        <p className="mt-6 text-sm text-text-secondary">
          Cotação indisponível.
        </p>
      )}

      <p className="mt-5 text-xs leading-relaxed text-text-secondary">
        Os valores vêm da API simulada e serão
        revalidados antes da confirmação da compra.
      </p>

      <p className="mt-3 text-xs text-text-secondary">
        Pagamento e finalização serão implementados
        na Issue #18.
      </p>
    </aside>
  )
}