import { request } from './client'
import type { CategoryListItem } from './types'

export function getCategories() {
  return request<CategoryListItem[]>('/api/v1/categories')
}
