import { worker } from './browser'
import { initMockDb, resetMockDb } from './db'
import {
  clearScenario,
  getScenario,
  isScenario,
  SCENARIOS,
  setScenario,
  type ScenarioName,
} from './scenario'

declare global {
  interface Window {
    mocks?: {
      reset: (reload?: boolean) => Promise<void>
      scenario: () => ScenarioName
      scenarios: readonly ScenarioName[]
      setScenario: (name: string) => void
    }
  }
}

export async function startMocks(): Promise<void> {
  await initMockDb()
  window.mocks = {
    reset: async (reload = true) => {
      clearScenario()
      await resetMockDb()
      if (reload) window.location.reload()
    },
    scenario: getScenario,
    scenarios: SCENARIOS,
    setScenario: (name) => {
      if (!isScenario(name)) {
        throw new Error(`Cenário inválido: "${name}". Use um de: ${SCENARIOS.join(', ')}`)
      }
      setScenario(name)
      console.info(`[mocks] Cenário ativo: ${name}`)
    },
  }
  await worker.start({ onUnhandledFrame: 'bypass' })
}