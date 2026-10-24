import { AxiosError } from 'axios'
import type { ApiErrorResponse } from '@/contracts/api'

export function getFieldErrors(error: unknown): Record<string, string> {
  if (error instanceof AxiosError) {
    const data = error.response?.data as ApiErrorResponse | undefined
    return data?.error?.fieldErrors ?? {}
  }

  return {}
}