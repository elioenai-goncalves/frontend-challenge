import {
  io,
  type Socket,
} from 'socket.io-client'

import type {
  ServerToClientEvents,
} from '@/contracts/api'

export type RealtimeSocket =
  Socket<ServerToClientEvents>

export function createRealtimeSocket(): RealtimeSocket {
  return io(window.location.origin, {
    path: '/socket.io',
    transports: ['websocket'],
    autoConnect: false,
    reconnection: true,
    reconnectionAttempts: 5,
    timeout: 10_000,
  })
}