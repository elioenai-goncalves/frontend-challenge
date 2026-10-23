import axios, { AxiosError } from 'axios'
import type { ApiErrorResponse } from '@/contracts/api'

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? '/api',
  headers: {
    'Content-Type': 'application/json',
  },
})

let accessToken: string | null = null

export function setApiAccessToken(token: string | null): void {
  accessToken = token
}

api.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.set('Authorization', `Bearer ${accessToken}`)
  } else {
    config.headers.delete('Authorization')
  }

  return config
})

api.interceptors.response.use((response) => {
  const contentType = String(response.headers['content-type'] ?? '')

  if (contentType.includes('text/html')) {
    throw new Error(
      'A API retornou HTML em vez de JSON. Confira a URL da API e se os mocks estão ativos.',
    )
  }

  return response
})

export function getApiErrorMessage(error: unknown): string {
  if (error instanceof AxiosError) {
    const response = error.response?.data as ApiErrorResponse | undefined

    if (response?.error?.message) {
      return response.error.message
    }
  }

  if (error instanceof Error) {
    return error.message
  }

  return 'Não foi possível concluir a solicitação. Tente novamente.'
}