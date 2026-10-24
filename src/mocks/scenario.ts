export const SCENARIOS = [
  'success',
  'empty',
  'latency',
  'out-of-order',
  'network-error',
  'http-4xx',
  'http-5xx',
  'session-expired',
  'register-conflict',
  'validation-error',
  'coupon-invalid',
  'coupon-expired',
  'price-changed',
  'sold-out',
  'order-timeout',
  'payment-refused',
  'payment-confirmed',
] as const

export type ScenarioName = (typeof SCENARIOS)[number]

export const DEFAULT_SCENARIO: ScenarioName = 'success'
const STORAGE_KEY = 'frontend-challenge:mock-scenario'

export function isScenario(value: unknown): value is ScenarioName {
  return typeof value === 'string' && (SCENARIOS as readonly string[]).includes(value)
}

// Estado de execução: zera ao trocar de cenário, resetar ou recarregar a página.
const counters = new Map<string, number>()
const applied = new Set<string>()

export function resetScenarioRuntime(): void {
  counters.clear()
  applied.clear()
}

export function nextCount(key: string): number {
  const current = counters.get(key) ?? 0
  counters.set(key, current + 1)
  return current
}

export function applyOnce(key: string): boolean {
  if (applied.has(key)) return false
  applied.add(key)
  return true
}

export function getScenario(): ScenarioName {
  const stored = localStorage.getItem(STORAGE_KEY)
  if (isScenario(stored)) return stored
  const fromEnv: unknown = import.meta.env.VITE_MOCK_SCENARIO
  if (isScenario(fromEnv)) return fromEnv
  return DEFAULT_SCENARIO
}

export function setScenario(name: ScenarioName): void {
  localStorage.setItem(STORAGE_KEY, name)
  resetScenarioRuntime()
}

export function clearScenario(): void {
  localStorage.removeItem(STORAGE_KEY)
  resetScenarioRuntime()
}