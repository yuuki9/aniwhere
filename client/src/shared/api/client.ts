import type { ApiResponse } from './types'
import { getStoredAccessToken } from '../lib/authSession'

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? 'https://api.aniwhere.link'

type QueryValue = string | number | boolean | undefined | null
type QueryParams = Record<string, QueryValue | QueryValue[]>
type ApiRequestInit = RequestInit & {
  authToken?: string | null
}

function removeHeaderUnsafeCharacters(value: string) {
  return Array.from(value)
    .filter((character) => {
      const code = character.charCodeAt(0)
      return code > 31 && (code < 127 || code > 159) && code !== 0x2028 && code !== 0x2029
    })
    .join('')
}

function toAuthorizationHeaderValue(authToken: string | null | undefined) {
  const trimmed = authToken?.trim()
  if (!trimmed) {
    return null
  }

  const withoutBearer = trimmed.replace(/^Bearer[\s\u00A0]+/i, '')
  const headerSafeToken = withoutBearer
    .replace(/^["'“”‘’]+|["'“”‘’]+$/g, '')
    .replace(/[\s\u00A0]+/g, '')
  const normalizedToken = removeHeaderUnsafeCharacters(headerSafeToken)
    .replace(/[\s\u00A0]+/g, '')
    .trim()

  return normalizedToken ? `Bearer ${normalizedToken}` : null
}

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

export async function request<T>(path: string, init?: ApiRequestInit): Promise<T> {
  const { authToken, ...requestInit } = init ?? {}
  const headers = new Headers(init?.headers)
  const resolvedAuthToken = authToken === undefined ? getStoredAccessToken() : authToken

  // Keep body-less GET/HEAD calls simple so the API does not receive an unnecessary CORS preflight.
  if (init?.body != null && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }
  const authorization = toAuthorizationHeaderValue(resolvedAuthToken)
  if (authorization && !headers.has('Authorization')) {
    headers.set('Authorization', authorization)
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...requestInit,
    headers: {
      ...Object.fromEntries(headers),
    },
  })

  const payload = (await response.json()) as ApiResponse<T>

  if (!response.ok || !payload.success) {
    throw new Error(payload.message ?? '요청 처리에 실패했습니다.')
  }

  return payload.data as T
}

export async function requestNoContent(path: string, init?: ApiRequestInit): Promise<void> {
  const { authToken, ...requestInit } = init ?? {}
  const headers = new Headers(init?.headers)
  const resolvedAuthToken = authToken === undefined ? getStoredAccessToken() : authToken

  if (init?.body != null && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }
  const authorization = toAuthorizationHeaderValue(resolvedAuthToken)
  if (authorization && !headers.has('Authorization')) {
    headers.set('Authorization', authorization)
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...requestInit,
    headers: {
      ...Object.fromEntries(headers),
    },
  })

  if (response.ok) {
    return
  }

  let message = '요청 처리에 실패했습니다.'
  try {
    const payload = (await response.json()) as ApiResponse<unknown>
    message = payload.message ?? message
  } catch {
    // Some no-content endpoints may return an empty error body.
  }

  throw new Error(message)
}

export async function requestForm<T>(path: string, body: FormData, init?: ApiRequestInit): Promise<T> {
  const { authToken, ...requestInit } = init ?? {}
  const headers = new Headers(init?.headers)
  const resolvedAuthToken = authToken === undefined ? getStoredAccessToken() : authToken

  const authorization = toAuthorizationHeaderValue(resolvedAuthToken)
  if (authorization && !headers.has('Authorization')) {
    headers.set('Authorization', authorization)
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: 'POST',
    ...requestInit,
    headers: {
      ...Object.fromEntries(headers),
    },
    body,
  })

  const payload = (await response.json()) as ApiResponse<T>

  if (!response.ok || !payload.success) {
    throw new Error(payload.message ?? '요청 처리에 실패했습니다.')
  }

  return payload.data as T
}
