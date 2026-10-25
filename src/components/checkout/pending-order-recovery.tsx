import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react'

import { AxiosError } from 'axios'

import type {
  ApiErrorResponse,
  Order,
} from '@/contracts/api'

import { useSubmitOrder } from '@/hooks/use-submit-order'

import { getApiErrorMessage } from '@/lib/api-client'
import { getSession } from '@/lib/session'

import {
  clearPendingOrder,
  type PendingOrder,
} from '@/lib/pending-order'

type RecoveryResult = 'rejected' | 'invalid'

interface PendingOrderRecoveryProps {
  userId: string
  attempt: PendingOrder
  onConfirmed: (order: Order) => void
  onFinished: (
    result: RecoveryResult,
    message: string,
  ) => void
}

export function PendingOrderRecovery({
  userId,
  attempt,
  onConfirmed,
  onFinished,
}: PendingOrderRecoveryProps) {
  const submitOrder = useSubmitOrder(userId)

  const [verifying, setVerifying] = useState(false)
  const [errorMessage, setErrorMessage] =
    useState<string | null>(null)

  const inFlight = useRef(false)
  const autoStarted = useRef(false)

  const verifyPendingOrder = useCallback(async () => {
    if (inFlight.current) return

    if (getSession().user?.id !== userId) return

    inFlight.current = true
    setVerifying(true)
    setErrorMessage(null)

    try {
      const order = await submitOrder.mutateAsync(attempt)

      if (getSession().user?.id !== userId) return

      if (order.status === 'confirmed') {
        clearPendingOrder(userId, attempt.key)
        onConfirmed(order)
        return
      }

      if (order.status === 'rejected') {
        clearPendingOrder(userId, attempt.key)

        onFinished(
          'rejected',
          order.rejectionReason ??
            'O pagamento foi recusado.',
        )

        return
      }

      setErrorMessage(
        'O pagamento continua pendente. ' +
        'Verifique novamente a mesma tentativa.',
      )
    } catch (error) {
      if (getSession().user?.id !== userId) return

      if (error instanceof AxiosError) {
        const status = error.response?.status

        const response =
          error.response?.data as
            | ApiErrorResponse
            | undefined

        const code = response?.error?.code

        if (
          status !== undefined &&
          status >= 400 &&
          status < 500 &&
          status !== 401 &&
          code !== 'IDEMPOTENCY_CONFLICT'
        ) {
          clearPendingOrder(userId, attempt.key)

          onFinished(
            'invalid',
            getApiErrorMessage(error),
          )

          return
        }
      }

      setErrorMessage(
        'Ainda não foi possível confirmar o resultado. ' +
        getApiErrorMessage(error),
      )
    } finally {
      inFlight.current = false
      setVerifying(false)
    }
  }, [
    attempt,
    userId,
    submitOrder,
    onConfirmed,
    onFinished,
  ])

  useEffect(() => {
    if (autoStarted.current) return

    autoStarted.current = true

    void verifyPendingOrder()
  }, [verifyPendingOrder])

  useEffect(() => {
    function handleOnline() {
      void verifyPendingOrder()
    }

    window.addEventListener('online', handleOnline)

    return () => {
      window.removeEventListener('online', handleOnline)
    }
  }, [verifyPendingOrder])

  return (
    <section
      aria-labelledby="pending-order-title"
      className="mx-auto max-w-2xl"
    >
      <div className="rounded-lg border border-primary bg-card p-6">
        <h2
          id="pending-order-title"
          className="text-2xl font-bold"
        >
          Verificando pagamento
        </h2>

        <p className="mt-4 text-text-secondary">
          Encontramos uma tentativa de pagamento
          cujo resultado ainda precisa ser confirmado.
        </p>

        <p className="mt-3 text-sm text-text-secondary">
          Para evitar uma compra duplicada, estamos
          consultando a mesma operação enviada
          anteriormente.
        </p>

        <dl className="mt-6 space-y-3 text-sm">
          <div>
            <dt className="text-text-secondary">
              Tentativa registrada em
            </dt>

            <dd className="mt-1">
              {new Date(
                attempt.createdAt,
              ).toLocaleString('pt-BR')}
            </dd>
          </div>

          <div>
            <dt className="text-text-secondary">
              Identificador da tentativa
            </dt>

            <dd className="mt-1 break-all font-mono text-xs">
              {attempt.key}
            </dd>
          </div>
        </dl>

        {verifying && (
          <p
            role="status"
            className="mt-6 text-sm text-primary"
          >
            Consultando o resultado do pagamento...
          </p>
        )}

        {errorMessage && (
          <p
            role="alert"
            className="mt-6 rounded-md border border-destructive p-4 text-sm text-destructive"
          >
            {errorMessage}
          </p>
        )}

        <button
          type="button"
          disabled={verifying || submitOrder.isPending}
          onClick={() => void verifyPendingOrder()}
          className={[
            'mt-6 min-h-11 w-full rounded-md',
            'bg-primary px-4 font-semibold',
            'text-primary-foreground disabled:opacity-50',
          ].join(' ')}
        >
          {verifying
            ? 'Verificando pedido...'
            : 'Verificar a mesma tentativa'}
        </button>

        <p className="mt-4 text-xs leading-relaxed text-text-secondary">
          Esta verificação reutiliza a chave original.
          Nenhum novo pedido é iniciado.
        </p>
      </div>
    </section>
  )
}