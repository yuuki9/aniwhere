import { request, requestForm, toQueryString } from './client'
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
    status: params.status,
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

export function createShopWithImages(payload: ShopRequest, files: File[]) {
  const formData = new FormData()

  appendShopRequestFields(formData, payload)

  if (files.length === 0) {
    throw new Error('대표 이미지는 최소 1개가 필요합니다.')
  }

  formData.set('coverImage', files[0])
  files.slice(1, 7).forEach((file) => {
    formData.append('galleryImages', file)
  })

  return requestForm<Shop>('/api/v1/shops', formData)
}

type UpdateShopImagePayload = {
  coverImage?: File | null
  replaceGallery?: boolean
  galleryImages?: File[]
}

export function updateShopWithImages(id: number, payload: ShopRequest, images: UpdateShopImagePayload) {
  const formData = new FormData()

  appendShopRequestFields(formData, payload)

  if (images.coverImage) {
    formData.set('coverImage', images.coverImage)
  }

  if (images.replaceGallery) {
    formData.set('replaceGallery', 'true')
    images.galleryImages?.slice(0, 6).forEach((file) => {
      formData.append('galleryImages', file)
    })
  }

  return requestForm<Shop>(`/api/v1/shops/${id}`, formData, { method: 'PUT' })
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

function appendShopRequestFields(formData: FormData, payload: ShopRequest) {
  formData.set('name', payload.name)
  formData.set('address', payload.address)
  formData.set('px', String(payload.px))
  formData.set('py', String(payload.py))
  if (payload.floor != null) {
    formData.set('floor', payload.floor)
  }
  if (payload.regionId != null) {
    formData.set('regionId', String(payload.regionId))
  }
  formData.set('status', payload.status)
  if (payload.sellsIchibanKuji != null) {
    formData.set('sellsIchibanKuji', String(payload.sellsIchibanKuji))
  }
  if (payload.visitTip != null) {
    formData.set('visitTip', payload.visitTip)
  }
}
