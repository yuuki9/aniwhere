import { request } from './client'
import type { LoginResult, RefreshAuthPayload, RefreshResult, TossLoginPayload, Unit } from './types'

export function tossLogin(payload: TossLoginPayload) {
  return request<LoginResult>('/api/v1/auth/toss/login', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function refreshAuth(payload: RefreshAuthPayload) {
  return request<RefreshResult>('/api/v1/auth/refresh', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function logout(payload: RefreshAuthPayload) {
  return request<Unit>('/api/v1/auth/logout', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}
