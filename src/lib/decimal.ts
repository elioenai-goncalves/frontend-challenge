const SCALE = 10n ** 18n

export const ETH_PATTERN = /^\d+(\.\d+)?$/

function toUnits(value: string): bigint {
  const [integer, fraction = ''] = value.split('.')
  return BigInt(integer || '0') * SCALE + BigInt(fraction.padEnd(18, '0').slice(0, 18))
}

export function compareEth(a: string, b: string): number {
  const x = toUnits(a)
  const y = toUnits(b)
  return x < y ? -1 : x > y ? 1 : 0
}