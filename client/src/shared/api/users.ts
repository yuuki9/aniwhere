import { request, toQueryString } from './client'
import type {
  NicknameAvailabilityResult,
  PageResponse,
  PagingParams,
  Shop,
  UpdateNicknamePayload,
  UpdateUserRolePayload,
  UserSummary,
} from './types'

export function getMyProfile(authToken?: string | null) {
  return request<UserSummary>('/api/v1/users/me', { authToken })
}

export function listMyFavoriteShops(authToken?: string | null) {
  return request<Shop[]>('/api/v1/users/me/favorite-shops', { authToken })
}

export function listUsers(params: PagingParams = {}, authToken?: string | null) {
  const query = toQueryString({
    page: params.page ?? 0,
    size: params.size ?? 20,
    sort: params.sort,
  })

  return request<PageResponse<UserSummary>>(`/api/v1/users${query}`, { authToken })
}

export function getUserDetail(id: number, authToken?: string | null) {
  return request<UserSummary>(`/api/v1/users/${id}`, { authToken })
}

export function checkNicknameAvailability(nickname: string, authToken?: string | null) {
  const query = toQueryString({ nickname })

  return request<NicknameAvailabilityResult>(`/api/v1/users/nickname/availability${query}`, { authToken })
}

export function updateMyNickname(payload: UpdateNicknamePayload, authToken?: string | null) {
  return request<UserSummary>('/api/v1/users/me/nickname', {
    method: 'PATCH',
    body: JSON.stringify(payload),
    authToken,
  })
}

export function updateUserRole(userId: number, payload: UpdateUserRolePayload, authToken?: string | null) {
  return request<UserSummary>(`/api/v1/admin/users/${userId}/role`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
    authToken,
  })
}
