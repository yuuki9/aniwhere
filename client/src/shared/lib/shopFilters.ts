import type { ShopFacetParams, ShopSearchParams, ShopStatus } from '../api/types'

export type ShopFilters = {
  regionId?: number
  categoryIds: number[]
  workId?: number
  status?: ShopStatus
}

const SHOP_STATUSES: ShopStatus[] = ['ACTIVE', 'CLOSED', 'UNVERIFIED']

function parsePositiveInt(value: string | null) {
  if (value == null || !/^\d+$/.test(value)) {
    return undefined
  }

  const parsed = Number(value)
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : undefined
}

function parseCategoryIds(searchParams: URLSearchParams) {
  const seen = new Set<number>()
  const categoryIds: number[] = []

  searchParams.getAll('categoryIds').forEach((value) => {
    const parsed = parsePositiveInt(value)

    if (parsed == null || seen.has(parsed)) {
      return
    }

    seen.add(parsed)
    categoryIds.push(parsed)
  })

  return categoryIds
}

function parseStatus(value: string | null) {
  return SHOP_STATUSES.find((status) => status === value)
}

export function parseShopFilters(searchParams: URLSearchParams): ShopFilters {
  return {
    regionId: parsePositiveInt(searchParams.get('regionId')),
    categoryIds: parseCategoryIds(searchParams),
    workId: parsePositiveInt(searchParams.get('workId')),
    status: parseStatus(searchParams.get('status')),
  }
}

export function writeShopFilters(searchParams: URLSearchParams, filters: ShopFilters) {
  const next = new URLSearchParams(searchParams)

  next.delete('regionId')
  next.delete('categoryIds')
  next.delete('workId')
  next.delete('status')
  next.delete('page')

  if (filters.regionId != null) {
    next.set('regionId', String(filters.regionId))
  }

  filters.categoryIds.forEach((categoryId) => {
    next.append('categoryIds', String(categoryId))
  })

  if (filters.workId != null) {
    next.set('workId', String(filters.workId))
  }

  if (filters.status != null) {
    next.set('status', filters.status)
  }

  next.set('page', '0')
  return next
}

export function toShopSearchParams(filters: ShopFilters): Pick<ShopSearchParams, 'regionId' | 'categoryIds' | 'workId' | 'status'> {
  return {
    regionId: filters.regionId,
    categoryIds: filters.categoryIds.length > 0 ? filters.categoryIds : undefined,
    workId: filters.workId,
    status: filters.status,
  }
}

export function toShopFacetParams(filters: ShopFilters, context: Pick<ShopFacetParams, 'keyword'> = {}): ShopFacetParams {
  return {
    keyword: context.keyword,
    regionIds: filters.regionId != null ? [filters.regionId] : undefined,
    categoryIds: filters.categoryIds.length > 0 ? filters.categoryIds : undefined,
    workIds: filters.workId != null ? [filters.workId] : undefined,
    status: filters.status,
  }
}

export function countShopFilters(filters: ShopFilters) {
  return (
    (filters.regionId != null ? 1 : 0) +
    (filters.categoryIds.length > 0 ? 1 : 0) +
    (filters.workId != null ? 1 : 0) +
    (filters.status != null ? 1 : 0)
  )
}
