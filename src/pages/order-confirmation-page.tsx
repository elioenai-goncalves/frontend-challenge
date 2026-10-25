import { AxiosError } from 'axios'
import { Link, useParams } from '@tanstack/react-router'
import { CheckCircle2, Clock3, XCircle } from 'lucide-react'

import { ErrorState } from '@/components/error-state'
import { LoadingSkeleton } from '@/components/ui/loading-skeleton'

import type { Order, QuoteResponse } from '@/contracts/api'

import { useOrder } from '@/hooks/use-order'
import { getApiErrorMessage } from '@/lib/api-client'
import { useSession } from '@/lib/session'

function ConfirmationSkeleton() {
  return (
    <div
      role="status"
      aria-label="Carregando pedido"
      className="mx-auto max-w-3xl space-y-5"
    >
      <span className="sr-only">
        Carregando confirmação do pedido...
      </span>

      <LoadingSkeleton className="h-20 w-full" />
      <LoadingSkeleton className="h-32 w-full" />
      <LoadingSkeleton className="h-48 w-full" />
      <LoadingSkeleton className="h-56 w-full" />
    </div>
  )
}

function OrderNotFound() {
  return (
    <section className="mx-auto max-w-2xl space-y-5">
      <h1 className="text-2xl font-bold">
        Pedido não encontrado
      </h1>

      <p className="text-text-secondary">
        Não encontramos um pedido associado à sua
        conta com esse identificador.
      </p>

      <Link
        to="/"
        search={{}}
        className="inline-flex min-h-11 items-center text-primary underline underline-offset-4"
      >
        Voltar ao catálogo
      </Link>
    </section>
  )
}

function UnconfirmedOrder({
  order,
}: {
  order: Order
}) {
  const rejected = order.status === 'rejected'

  return (
    <section className="mx-auto max-w-2xl space-y-6">
      <div className="rounded-lg border border-border bg-card p-6">
        <div className="flex items-center gap-3">
          {rejected ? (
            <XCircle
              size={28}
              className="text-destructive"
              aria-hidden="true"
            />
          ) : (
            <Clock3
              size={28}
              className="text-primary"
              aria-hidden="true"
            />
          )}

          <h1 className="text-2xl font-bold">
            {rejected
              ? 'Pagamento recusado'
              : 'Pedido em processamento'}
          </h1>
        </div>

        <p className="mt-4 text-text-secondary">
          {rejected
            ? order.rejectionReason ??
              'O pagamento não foi aprovado.'
            : 'O pedido ainda não foi confirmado. Não realize outra compra antes de verificar o resultado.'}
        </p>

        <p className="mt-5 break-all text-sm">
          <strong>Pedido:</strong> {order.id}
        </p>
      </div>

      <Link
        to="/cart"
        className="inline-flex min-h-11 items-center text-primary underline underline-offset-4"
      >
        Voltar ao carrinho
      </Link>
    </section>
  )
}

function ReceiptValues({
  receipt,
}: {
  receipt: QuoteResponse
}) {
  return (
    <dl className="space-y-4 text-sm">
      <div className="flex justify-between gap-4">
        <dt>Subtotal</dt>
        <dd className="text-right">
          {receipt.subtotalEth} ETH
        </dd>
      </div>

      <div className="flex justify-between gap-4">
        <dt>Desconto</dt>
        <dd className="text-right">
          {receipt.discountEth} ETH
        </dd>
      </div>

      <div className="flex justify-between gap-4">
        <dt>Taxa de rede</dt>
        <dd className="text-right">
          {receipt.networkFeeEth} ETH
        </dd>
      </div>

      <div className="flex justify-between gap-4 border-t border-border pt-5 text-lg font-bold">
        <dt>Total pago</dt>
        <dd className="text-right text-primary">
          {receipt.totalEth} ETH
        </dd>
      </div>
    </dl>
  )
}

function ConfirmedReceipt({
  order,
}: {
  order: Order
}) {
  const receipt = order.receipt

  return (
    <section
      aria-labelledby="confirmation-title"
      className="mx-auto max-w-3xl space-y-8"
    >
      <header className="text-center">
        <CheckCircle2
          size={52}
          className="mx-auto text-primary"
          aria-hidden="true"
        />

        <h1
          id="confirmation-title"
          className="mt-4 text-3xl font-bold"
        >
          Compra confirmada!
        </h1>

        <p className="mt-3 text-text-secondary">
          Seu pedido foi confirmado na simulação
          e os detalhes estão disponíveis abaixo.
        </p>
      </header>

      <section className="rounded-lg border border-border bg-card p-6">
        <h2 className="text-xl font-bold">
          Informações do pedido
        </h2>

        <dl className="mt-6 space-y-5 text-sm">
          <div>
            <dt className="text-text-secondary">
              Número do pedido
            </dt>
            <dd className="mt-1 break-all font-semibold">
              {order.id}
            </dd>
          </div>

          <div>
            <dt className="text-text-secondary">
              Status
            </dt>
            <dd className="mt-1 font-semibold text-primary">
              Confirmado
            </dd>
          </div>

          <div>
            <dt className="text-text-secondary">
              Data da compra
            </dt>
            <dd className="mt-1">
              <time dateTime={order.createdAt}>
                {new Date(order.createdAt).toLocaleString(
                  'pt-BR',
                )}
              </time>
            </dd>
          </div>

          <div>
            <dt className="text-text-secondary">
              Referência da transação
            </dt>
            <dd className="mt-1 break-all font-mono text-xs">
              {order.transactionReference ?? 'Indisponível'}
            </dd>
          </div>

          <div>
            <dt className="text-text-secondary">
              Rede utilizada
            </dt>
            <dd className="mt-1 capitalize">
              {receipt.network}
            </dd>
          </div>
        </dl>
      </section>

      <section className="rounded-lg border border-border bg-card p-6">
        <h2 className="text-xl font-bold">
          NFTs adquiridos
        </h2>

        <ul className="mt-6 space-y-5">
          {receipt.items.map((item) => (
            <li
              key={`${item.nftId}-${item.editionId}`}
              className="flex flex-col gap-4 border-b border-border pb-5 last:border-b-0 last:pb-0 sm:flex-row"
            >
              {item.imageUrl ? (
                <img
                  src={item.imageUrl}
                  alt={item.nftName}
                  width={112}
                  height={112}
                  loading="lazy"
                  className="aspect-square w-full rounded-md object-cover sm:size-28 sm:shrink-0"
                />
              ) : (
                <div className="grid aspect-square w-full place-items-center rounded-md bg-background text-sm text-text-secondary sm:size-28">
                  Imagem indisponível
                </div>
              )}

              <div className="min-w-0 flex-1 text-sm">
                <h3 className="font-bold">
                  {item.nftName}
                </h3>

                <p className="mt-2 text-text-secondary">
                  Edição: {item.editionLabel}
                </p>

                <p className="mt-1 text-text-secondary">
                  Quantidade: {item.quantity}
                </p>

                <p className="mt-2">
                  Preço unitário: {item.unitPriceEth} ETH
                </p>

                <p className="mt-1 font-semibold text-primary">
                  Total do item: {item.lineTotalEth} ETH
                </p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-lg border border-border bg-card p-6">
        <h2 className="mb-6 text-xl font-bold">
          Resumo financeiro
        </h2>

        <ReceiptValues receipt={receipt} />

        <p className="mt-5 border-t border-border pt-4 text-sm text-text-secondary">
          {receipt.couponCode
            ? `Cupom aplicado: ${receipt.couponCode}`
            : 'Nenhum cupom aplicado'}
        </p>
      </section>

      <section className="rounded-lg border border-border bg-card p-6">
        <h2 className="text-xl font-bold">
          Dados da compra
        </h2>

        <dl className="mt-6 space-y-5 text-sm">
          <div>
            <dt className="text-text-secondary">
              Colecionador
            </dt>
            <dd className="mt-1">
              {order.collector.name}
            </dd>
          </div>

          <div>
            <dt className="text-text-secondary">
              E-mail
            </dt>
            <dd className="mt-1 wrap-break-word">
              {order.collector.email}
            </dd>
          </div>

          <div>
            <dt className="text-text-secondary">
              Carteira utilizada
            </dt>
            <dd className="mt-1">
              {order.wallet.label}
            </dd>
          </div>

          <div>
            <dt className="text-text-secondary">
              Endereço da carteira
            </dt>
            <dd className="mt-1 break-all font-mono text-xs">
              {order.wallet.address}
            </dd>
          </div>
        </dl>
      </section>

      <p className="text-center text-sm text-text-secondary">
        Este recibo utiliza os dados registrados
        no momento da compra, independentemente de
        alterações futuras nos NFTs.
      </p>

      <nav
        aria-label="Ações após a compra"
        className="flex flex-col gap-3 sm:flex-row sm:justify-center"
      >
        <Link
          to="/"
          search={{}}
          className="inline-flex min-h-11 items-center justify-center rounded-md bg-primary px-6 font-semibold text-primary-foreground"
        >
          Explorar NFTs
        </Link>

        <Link
          to="/cart"
          className="inline-flex min-h-11 items-center justify-center rounded-md border border-border px-6 font-semibold"
        >
          Ver carrinho
        </Link>
      </nav>
    </section>
  )
}

export function OrderConfirmationPage() {
  const { orderId } = useParams({
    from: '/orders/$orderId/confirmation',
  })

  const session = useSession()
  const userId = session.user?.id ?? null

  const order = useOrder(userId, orderId)

  if (session.status !== 'authenticated') {
    return (
      <p role="status">
        Entre na sua conta para consultar o pedido.
      </p>
    )
  }

  if (order.isPending) {
    return <ConfirmationSkeleton />
  }

  if (order.isError) {
    if (
      order.error instanceof AxiosError &&
      order.error.response?.status === 404
    ) {
      return <OrderNotFound />
    }

    return (
      <div className="mx-auto max-w-2xl">
        <ErrorState
          description={getApiErrorMessage(order.error)}
          onRetry={() => void order.refetch()}
          isRetrying={order.isFetching}
        />
      </div>
    )
  }

  if (!order.data || order.data.userId !== userId) {
    return <OrderNotFound />
  }

  if (order.data.status !== 'confirmed') {
    return <UnconfirmedOrder order={order.data} />
  }

  return <ConfirmedReceipt order={order.data} />
}