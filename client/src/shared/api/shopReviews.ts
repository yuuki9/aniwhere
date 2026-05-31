import { request, requestForm, toQueryString } from './client'
import type {
  CreateShopReviewPayload,
  PageResponse,
  ShopReview,
  ShopReviewListParams,
  ShopReviewStatus,
  Unit,
  UpdateShopReviewPayload,
} from './types'

function shopReviewPath(shopId: number) {
  return `/api/v1/shops/${shopId}/reviews`
}

function shopReviewDetailPath(shopId: number, reviewId: number) {
  return `${shopReviewPath(shopId)}/${reviewId}`
}

function appendReviewImageFields(formData: FormData, payload: CreateShopReviewPayload | UpdateShopReviewPayload) {
  formData.append('rating', String(payload.rating))
  formData.append('content', payload.content)

  for (const image of payload.images ?? []) {
    formData.append('images', image)
  }
}

export function listShopReviews(shopId: number, params: ShopReviewListParams = {}, authToken?: string | null) {
  const query = toQueryString({
    page: params.page ?? 0,
    size: params.size ?? 20,
    sort: params.sort ?? 'NEWEST',
  })

  return request<PageResponse<ShopReview>>(`${shopReviewPath(shopId)}${query}`, { authToken })
}

export function createShopReview(shopId: number, payload: CreateShopReviewPayload, authToken?: string | null) {
  const formData = new FormData()
  appendReviewImageFields(formData, payload)

  return requestForm<ShopReview>(shopReviewPath(shopId), formData, { authToken })
}

export function updateShopReview(
  shopId: number,
  reviewId: number,
  payload: UpdateShopReviewPayload,
  authToken?: string | null,
) {
  const formData = new FormData()
  appendReviewImageFields(formData, payload)

  return requestForm<ShopReview>(shopReviewDetailPath(shopId, reviewId), formData, {
    method: 'PATCH',
    authToken,
  })
}

export function listMyReviews(params: ShopReviewListParams = {}, authToken?: string | null) {
  const query = toQueryString({
    page: params.page ?? 0,
    size: params.size ?? 20,
    sort: params.sort ?? 'NEWEST',
  })

  return request<PageResponse<ShopReview>>(`/api/v1/users/me/reviews${query}`, { authToken })
}

export function deleteShopReview(shopId: number, reviewId: number, authToken?: string | null) {
  return request<Unit>(shopReviewDetailPath(shopId, reviewId), {
    method: 'DELETE',
    authToken,
  })
}

export function likeShopReview(shopId: number, reviewId: number, authToken?: string | null) {
  return request<Unit>(`${shopReviewDetailPath(shopId, reviewId)}/likes`, {
    method: 'POST',
    authToken,
  })
}

export function unlikeShopReview(shopId: number, reviewId: number, authToken?: string | null) {
  return request<Unit>(`${shopReviewDetailPath(shopId, reviewId)}/likes`, {
    method: 'DELETE',
    authToken,
  })
}

export function updateShopReviewStatus(
  shopId: number,
  reviewId: number,
  status: ShopReviewStatus,
  authToken?: string | null,
) {
  return request<ShopReview>(`/api/v1/admin/shops/${shopId}/reviews/${reviewId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
    authToken,
  })
}
