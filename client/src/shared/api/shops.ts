import { request, toQueryString } from './client'
import type {
  PageResponse,
  Shop,
  ShopRequest,
  ShopSearchParams,
  Unit,
} from './types'

export function getShops(params: ShopSearchParams = {}) {
  const query = toQueryString({
    page: params.page ?? 0,
    size: params.size ?? 20,
    sort: params.sort,
    regionId: params.regionId,
    category: params.category,
    keyword: params.keyword,
  })

  return request<PageResponse<Shop>>(`/api/v1/shops${query}`)
}

export function getShop(id: number) {
  return request<Shop>(`/api/v1/shops/${id}`)
}

export function createShop(payload: ShopRequest) {
  return request<Shop>('/api/v1/shops', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function updateShop(id: number, payload: ShopRequest) {
  return request<Shop>(`/api/v1/shops/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
}

export function deleteShop(id: number) {
  return request<Unit>(`/api/v1/shops/${id}`, {
    method: 'DELETE',
  })
}
