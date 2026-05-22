import { request } from './client'
import type { RegionListItem } from './types'

export function getRegions() {
  return request<RegionListItem[]>('/api/v1/regions')
}
