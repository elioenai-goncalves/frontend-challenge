
import { defineConfig, devices } from '@playwright/test'

const remoteBaseURL = process.env.PLAYWRIGHT_BASE_URL

const localBaseURL = 'http://127.0.0.1:5173'

export default defineConfig({
  testDir: './tests/e2e',

  fullyParallel: false,
  workers: 1,

  timeout: 30_000,

  expect: {
    timeout: 10_000,
  },

  retries: process.env.CI ? 2 : 0,

  reporter: [
    ['list'],
    [
      'html',
      {
        outputFolder: 'playwright-report',
        open: 'never',
      },
    ],
  ],

  outputDir: 'test-results',

  use: {
    baseURL: remoteBaseURL || localBaseURL,

    serviceWorkers: 'allow',

    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',

    actionTimeout: 10_000,
    navigationTimeout: 20_000,
  },

  projects: [
    {
      name: 'chromium-desktop',

      use: {
        ...devices['Desktop Chrome'],

        viewport: {
          width: 1440,
          height: 900,
        },
      },
    },

    {
      name: 'chromium-mobile',

      use: {
        ...devices['Desktop Chrome'],

        viewport: {
          width: 390,
          height: 844,
        },

        isMobile: true,
        hasTouch: true,
        deviceScaleFactor: 1,
      },
    },
  ],

  webServer: remoteBaseURL
    ? undefined
    : {
        command:
          'npm run dev -- --host 127.0.0.1 --port 5173 --strictPort',

        url: localBaseURL,

        reuseExistingServer: !process.env.CI,

        timeout: 60_000,

        env: {
          VITE_ENABLE_MOCKS: 'true',
          VITE_API_BASE_URL: '/api',
          VITE_MOCK_SCENARIO: 'success',
        },
      },
})
