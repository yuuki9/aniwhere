import { request, toQueryString } from './client'
import type { WorkCatalogItem, WorkType } from './types'

type GetWorksParams = {
  type?: WorkType
}

export function getWorks(params: GetWorksParams = {}) {
  const query = toQueryString({
    type: params.type,
  })

  return request<WorkCatalogItem[]>(`/api/v1/works${query}`)
}
