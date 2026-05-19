import { request } from './client'
import type { WorkCatalogItem } from './types'

export function getWorks() {
  return request<WorkCatalogItem[]>('/api/v1/works')
}
