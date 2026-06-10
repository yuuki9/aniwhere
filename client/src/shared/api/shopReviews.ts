import { request, requestForm, toQueryString } from './client'
import type {
  CreateShopReviewPayload,
  PageResponse,
  RecentShopReview,
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
  for (const image of payload.images ?? []) {
    formData.append('images', image)
  }
}

function reviewMutationQuery(
  payload: CreateShopReviewPayload | UpdateShopReviewPayload,
  options?: { replaceImages?: boolean; existingImageIds?: number[] },
) {
  return toQueryString({
    rating: payload.rating,
    content: payload.content,
    replaceImages: options?.replaceImages,
    existingImageIds: options?.existingImageIds,
  })
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
  const query = reviewMutationQuery(payload)

  return requestForm<ShopReview>(`${shopReviewPath(shopId)}${query}`, formData, { authToken })
}

export function updateShopReview(
  shopId: number,
  reviewId: number,
  payload: UpdateShopReviewPayload,
  authToken?: string | null,
) {
  const formData = new FormData()
  appendReviewImageFields(formData, payload)
  const shouldReplaceImages = payload.existingImageIds !== undefined || (payload.images?.length ?? 0) > 0
  const query = reviewMutationQuery(payload, {
    replaceImages: shouldReplaceImages ? true : undefined,
    existingImageIds: shouldReplaceImages ? payload.existingImageIds ?? [] : undefined,
  })

  return requestForm<ShopReview>(`${shopReviewDetailPath(shopId, reviewId)}${query}`, formData, {
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

export function listRecentReviews(params: { limit?: number } = {}) {
  const query = toQueryString({
    limit: params.limit ?? 10,
  })

  return request<RecentShopReview[]>(`/api/v1/reviews/recent${query}`)
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
