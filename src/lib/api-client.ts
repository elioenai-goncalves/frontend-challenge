import axios, { AxiosError } from 'axios'
import type { ApiErrorResponse } from '@/contracts/api'

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? '/api',
  headers: {
    'Content-Type': 'application/json',
  },
})

let accessToken: string | null = null
let sessionExpiredHandler: (() => void) | null = null

export function setApiAccessToken(token: string | null): void {
  accessToken = token
}

export function setSessionExpiredHandler(handler: (() => void) | null): void {
  sessionExpiredHandler = handler
}

api.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.set('Authorization', `Bearer ${accessToken}`)
  } else {
    config.headers.delete('Authorization')
  }

  return config
})

api.interceptors.response.use(
  (response) => {
    const contentType = String(response.headers['content-type'] ?? '')

    if (contentType.includes('text/html')) {
      throw new Error(
        'A API retornou HTML em vez de JSON. Confira a URL da API e se os mocks estão ativos.',
      )
    }

    return response
  },
  (error: unknown) => {
    if (error instanceof AxiosError && error.response?.status === 401 && accessToken) {
      const code = (error.response.data as ApiErrorResponse | undefined)?.error?.code

      if (code === 'SESSION_EXPIRED' || code === 'UNAUTHORIZED') {
        sessionExpiredHandler?.()
      }
    }

    return Promise.reject(error)
  },
)

export function getApiErrorMessage(error: unknown): string {
  if (error instanceof AxiosError) {
    const response = error.response?.data as ApiErrorResponse | undefined

    if (response?.error?.message) {
      return response.error.message
    }

    if (!error.response) {
      return 'Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.'
    }
  }

  if (error instanceof Error) {
    return error.message
  }

  return 'Não foi possível concluir a solicitação. Tente novamente.'
}