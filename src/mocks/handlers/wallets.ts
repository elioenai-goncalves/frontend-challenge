import { http, HttpResponse } from 'msw/http'
import type {
  Network,
  SaveWalletRequest,
  Wallet,
  WalletResponse,
  WalletRole,
  WalletsResponse,
} from '@/contracts/api'
import { commit, db } from '../db'
import { authenticate, errorResponse, readJson } from '../utils'

const NETWORKS: Network[] = ['ethereum', 'polygon', 'solana']
const ROLES: WalletRole[] = ['primary', 'secondary']
const EVM_ADDRESS = /^0x[0-9a-fA-F]{40}$/
const SOLANA_ADDRESS = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/

function walletsOf(userId: string): Wallet[] {
  if (!db().wallets[userId]) db().wallets[userId] = []
  return db().wallets[userId]
}

function formatErrors(body: Partial<SaveWalletRequest>): Record<string, string> {
  const errors: Record<string, string> = {}
  const label = body.label?.trim() ?? ''
  const address = body.address?.trim() ?? ''
  if (label.length < 1 || label.length > 40) errors.label = 'Informe um nome de 1 a 40 caracteres.'
  if (!body.network || !NETWORKS.includes(body.network)) {
    errors.network = 'Escolha uma rede válida.'
  } else {
    const pattern = body.network === 'solana' ? SOLANA_ADDRESS : EVM_ADDRESS
    if (!pattern.test(address)) errors.address = 'Endereço inválido para a rede escolhida.'
  }
  if (!body.role || !ROLES.includes(body.role)) errors.role = 'Escolha principal ou secundária.'
  return errors
}

function conflictErrors(body: Partial<SaveWalletRequest>, others: Wallet[]): Record<string, string> {
  const errors: Record<string, string> = {}
  const address = body.address?.trim() ?? ''
  const sameAddress = (w: Wallet) =>
    w.network === body.network &&
    (body.network === 'solana'
      ? w.address === address
      : w.address.toLowerCase() === address.toLowerCase())
  if (others.some(sameAddress)) errors.address = 'Esta carteira já está cadastrada.'
  if (others.some((w) => w.role === body.role)) {
    errors.role =
      body.role === 'primary' ? 'Já existe uma carteira principal.' : 'Já existe uma carteira secundária.'
  }
  return errors
}

function validate(body: Partial<SaveWalletRequest>, others: Wallet[]) {
  const format = formatErrors(body)
  if (Object.keys(format).length > 0) {
    return errorResponse(422, 'VALIDATION_ERROR', 'Verifique os campos informados.', format)
  }
  const conflicts = conflictErrors(body, others)
  if (Object.keys(conflicts).length > 0) {
    return errorResponse(409, 'CONFLICT', 'Esta carteira conflita com uma já cadastrada.', conflicts)
  }
  return null
}

export const walletHandlers = [
  http.get('/api/wallets', ({ request }) => {
    const auth = authenticate(request)
    if ('response' in auth) return auth.response
    const body: WalletsResponse = { items: walletsOf(auth.user.id) }
    return HttpResponse.json(body)
  }),

  http.post('/api/wallets', async ({ request }) => {
    const auth = authenticate(request)
    if ('response' in auth) return auth.response

    const body = await readJson<SaveWalletRequest>(request)
    const list = walletsOf(auth.user.id)
    const invalid = validate(body, list)
    if (invalid) return invalid

    const wallet: Wallet = {
      id: crypto.randomUUID(),
      label: body.label!.trim(),
      address: body.address!.trim(),
      network: body.network!,
      role: body.role!,
    }
    list.push(wallet)
    commit()
    const response: WalletResponse = { wallet }
    return HttpResponse.json(response, { status: 201 })
  }),

  http.patch('/api/wallets/:walletId', async ({ request, params }) => {
    const auth = authenticate(request)
    if ('response' in auth) return auth.response

    const list = walletsOf(auth.user.id)
    const wallet = list.find((w) => w.id === params.walletId)
    if (!wallet) return errorResponse(404, 'NOT_FOUND', 'Carteira não encontrada.')

    const body = await readJson<SaveWalletRequest>(request)
    const invalid = validate(body, list.filter((w) => w.id !== wallet.id))
    if (invalid) return invalid

    wallet.label = body.label!.trim()
    wallet.address = body.address!.trim()
    wallet.network = body.network!
    wallet.role = body.role!
    commit()
    const response: WalletResponse = { wallet }
    return HttpResponse.json(response)
  }),
]