import type { ApiResponse } from './types'

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? 'http://3.39.150.248:61783'

type QueryValue = string | number | boolean | undefined | null
type QueryParams = Record<string, QueryValue | QueryValue[]>

export function toQueryString(params: QueryParams) {
  const search = new URLSearchParams()

  for (const [key, raw] of Object.entries(params)) {
    if (raw === '' || raw === undefined || raw === null) {
      continue
    }

    if (Array.isArray(raw)) {
      for (const value of raw) {
        if (value !== '' && value !== undefined && value !== null) {
          search.append(key, String(value))
        }
      }
      continue
    }

    search.set(key, String(raw))
  }

  const query = search.toString()
  return query ? `?${query}` : ''
}

export async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...init?.headers,
    },
    ...init,
  })

  const payload = (await response.json()) as ApiResponse<T>

  if (!response.ok || !payload.success) {
    throw new Error(payload.message ?? '요청 처리에 실패했습니다.')
  }

  return payload.data
}
