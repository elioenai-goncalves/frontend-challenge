import { initMockDb, resetMockDb } from './db'
import { worker } from './browser'

declare global {
  interface Window {
    mocks?: { reset: () => Promise<void> }
  }
}

export async function startMocks(): Promise<void> {
  await initMockDb()
  window.mocks = {
    reset: async () => {
      await resetMockDb()
      window.location.reload()
    },
  }
  await worker.start({ onUnhandledFrame: 'bypass' })
}