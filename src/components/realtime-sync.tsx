import { useEffect, useState } from 'react'

import type { RealtimeSocket } from '@/lib/realtime-client'

import {
  getApiAccessToken,
} from '@/lib/api-client'

import {
  getSession,
  onSessionEnd,
  useSession,
} from '@/lib/session'

import { queryClient } from '@/lib/query-client'

import { nftKeys } from '@/hooks/use-nfts'
import { cartKeys } from '@/hooks/use-cart'

import {
  applyNftUpdated,
  applyOrderUpdated,
} from '@/lib/realtime-cache'

export function RealtimeSync() {
  const session = useSession()

  const userId = session.user?.id ?? null

  const [sessionGeneration, setSessionGeneration] =
    useState(0)

  useEffect(() => {
    return onSessionEnd(() => {
      setSessionGeneration((previous) => previous + 1)
    })
  }, [])

  useEffect(() => {
    let disposed = false

    let socket: RealtimeSocket | null = null

    const token = getApiAccessToken()

    const nftVersions = new Map<string, number>()
    const orderVersions = new Map<string, number>()

    function isActive(): boolean {
      return (
        !disposed &&
        getApiAccessToken() === token &&
        (getSession().user?.id ?? null) === userId
      )
    }

    function disconnect() {
      disposed = true

      socket?.removeAllListeners()
      socket?.disconnect()
      socket = null
    }

    const unsubscribeSessionEnd =
      onSessionEnd(disconnect)

    async function connectRealtime() {
      try {
        const { createRealtimeSocket } =
          await import('@/lib/realtime-client')

        if (!isActive()) return

        const connection = createRealtimeSocket(token)
        socket = connection

        function reconcileActiveQueries() {
          if (!isActive()) return

          void queryClient.invalidateQueries({
            queryKey: nftKeys.all,
            refetchType: 'active',
          })

          void queryClient.invalidateQueries({
            queryKey: ['quote'],
            refetchType: 'active',
          })

          if (userId !== null) {
            void queryClient.invalidateQueries({
              queryKey: ['orders', userId],
              refetchType: 'active',
            })

            void queryClient.invalidateQueries({
              queryKey: cartKeys.forOwner(userId),
              refetchType: 'active',
            })
          }
        }

        connection.on('connect', () => {
          if (!isActive()) return

          console.info(
            '[realtime] Socket.IO conectado:',
            connection.id,
          )

          reconcileActiveQueries()
        })

        connection.on('disconnect', (reason) => {
          if (!isActive()) return

          console.info(
            '[realtime] Socket.IO desconectado:',
            reason,
          )
        })

        connection.on('connect_error', (error) => {
          if (!isActive()) return

          console.warn(
            '[realtime] Falha de conexão:',
            error.message,
          )
        })

        connection.on('nft.updated', (event) => {
          if (!isActive()) return

          void applyNftUpdated(
            event,
            nftVersions,
            isActive,
          ).catch((error: unknown) => {
            console.error(
              '[realtime] Falha ao atualizar NFT:',
              error,
            )
          })
        })

        connection.on('order.updated', (event) => {
          if (!isActive() || userId === null) return

          applyOrderUpdated(
            event,
            userId,
            connection.id,
            orderVersions,
            isActive,
          )
        })

        if (isActive()) {
          connection.connect()
        }
      } catch (error) {
        if (!isActive()) return

        console.error(
          '[realtime] Erro ao iniciar Socket.IO:',
          error,
        )
      }
    }

    void connectRealtime()

    return () => {
      unsubscribeSessionEnd()
      disconnect()
    }
  }, [userId, sessionGeneration])

  return null
}