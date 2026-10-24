import type { CartItem, Nft, Order, QuoteResponse, Wallet } from '@/contracts/api'
import { createSeed } from './seed'

export type StoredNft = Omit<Nft, 'imageUrls'> & { imageKeys: string[] }

export interface StoredUser {
  id: string
  name: string
  email: string
  avatarUrl: string | null
  passwordSalt: string
  passwordHash: string
}

export interface StoredSession {
  token: string
  userId: string
  expiresAt: string
}

export interface StoredCart {
  id: string
  userId: string | null
  items: CartItem[]
  version: number
}

export interface MockDb {
  schemaVersion: number
  users: StoredUser[]
  sessions: StoredSession[]
  nfts: StoredNft[]
  favorites: Record<string, string[]>
  carts: StoredCart[]
  wallets: Record<string, Wallet[]>
  quotes: QuoteResponse[]
  orders: Order[]
}

export const SCHEMA_VERSION = 1
const STORAGE_KEY = 'frontend-challenge:mock-db'

let state: MockDb | null = null

export function db(): MockDb {
  if (!state) {
    throw new Error('Banco de mocks não inicializado. Chame initMockDb() antes de iniciar o worker.')
  }
  return state
}

export function commit(): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

export async function resetMockDb(): Promise<void> {
  state = await createSeed()
  commit()
}

export async function initMockDb(): Promise<void> {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as MockDb
      if (parsed.schemaVersion === SCHEMA_VERSION) {
        state = parsed
        return
      }
    } catch {
      // estado corrompido: cai no reset abaixo
    }
  }
  await resetMockDb()
}