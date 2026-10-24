import type { MockDb } from './db'
import { SCHEMA_VERSION } from './db'
import { hashPassword, randomSalt } from './password'
import { buildNfts } from './catalog'

export const SEED_CREDENTIALS = [
  { id: 'user-ana', name: 'Ana Souza', email: 'ana@example.com', password: 'Senha123!' },
  { id: 'user-bruno', name: 'Bruno Lima', email: 'bruno@example.com', password: 'Senha456!' },
] as const

export async function createSeed(): Promise<MockDb> {
  const users = await Promise.all(
    SEED_CREDENTIALS.map(async (u) => {
      const passwordSalt = randomSalt()
      return {
        id: u.id,
        name: u.name,
        email: u.email,
        avatarUrl: null,
        passwordSalt,
        passwordHash: await hashPassword(u.password, passwordSalt),
      }
    }),
  )

  return {
    schemaVersion: SCHEMA_VERSION,
    users,
    sessions: [],
    nfts: buildNfts(),
    favorites: { 'user-ana': [], 'user-bruno': [] },
    carts: [],
    wallets: {
      'user-ana': [
        {
          id: 'wallet-ana-1',
          label: 'Carteira principal',
          address: '0x1111111111111111111111111111111111111111',
          network: 'ethereum',
          role: 'primary',
        },
      ],
      'user-bruno': [],
    },
    quotes: [],
    orders: [],
    idempotency: [],
  }
}