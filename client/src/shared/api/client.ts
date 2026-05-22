import type { ApiResponse } from './types'

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? 'https://api.aniwhere.link'

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
  const headers = new Headers(init?.headers)

  // Keep body-less GET/HEAD calls simple so the API does not receive an unnecessary CORS preflight.
  if (init?.body != null && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      ...Object.fromEntries(headers),
    },
  })

  const payload = (await response.json()) as ApiResponse<T>

  if (!response.ok || !payload.success) {
    throw new Error(payload.message ?? '요청 처리에 실패했습니다.')
  }

  return payload.data
}

export async function requestForm<T>(path: string, body: FormData, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: 'POST',
    ...init,
    body,
  })

  const payload = (await response.json()) as ApiResponse<T>

  if (!response.ok || !payload.success) {
    throw new Error(payload.message ?? '요청 처리에 실패했습니다.')
  }

  return payload.data
}
