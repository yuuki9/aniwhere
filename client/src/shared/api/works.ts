import { request, toQueryString } from './client'
import type { Unit, WorkCatalogItem, WorkType } from './types'

type GetWorksParams = {
  type?: WorkType
}

export function getWorks(params: GetWorksParams = {}) {
  const query = toQueryString({
    type: params.type,
  })

  return request<WorkCatalogItem[]>(`/api/v1/works${query}`)
}

export function addFavoriteWork(workId: number, authToken?: string | null) {
  return request<Unit>(`/api/v1/works/${workId}/favorite`, {
    method: 'POST',
    authToken,
  })
}

export function removeFavoriteWork(workId: number, authToken?: string | null) {
  return request<Unit>(`/api/v1/works/${workId}/favorite`, {
    method: 'DELETE',
    authToken,
  })
}
