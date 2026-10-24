const SCALE = 10n ** 18n
export const ETH_PATTERN = /^\d+(\.\d+)?$/

export function toUnits(value: string): bigint {
  const [integer, fraction = ''] = value.split('.')
  return BigInt(integer || '0') * SCALE + BigInt(fraction.padEnd(18, '0').slice(0, 18))
}

export function fromUnits(units: bigint): string {
  const integer = units / SCALE
  const fraction = (units % SCALE).toString().padStart(18, '0').replace(/0+$/, '')
  return fraction ? `${integer}.${fraction}` : `${integer}`
}