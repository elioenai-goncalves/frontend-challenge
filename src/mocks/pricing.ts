import type { Network } from '@/contracts/api'

export const NETWORK_FEES_ETH: Record<Network, string> = {
  ethereum: '0.002',
  polygon: '0.0005',
  solana: '0.0001',
}

export const QUOTE_TTL_MS = 5 * 60 * 1000

interface CouponRule {
  percent: number
  expired: boolean
}

export const COUPONS: Record<string, CouponRule> = {
  BEMVINDO10: { percent: 10, expired: false },
  ARTE25: { percent: 25, expired: false },
  VERAO5: { percent: 5, expired: true },
}