import type { ShopFacetResponse, ShopSearchParams, ShopStatus } from '../api/types'

export type ShopFilters = {
  regionIds: number[]
  categoryIds: number[]
  workId?: number
  status?: ShopStatus
}

export type AppliedShopFilterChip =
  | {
      key: string
      facet: 'region' | 'category'
      value: number
      label: string
      removeLabel: string
    }
  | {
      key: string
      facet: 'status'
      value: ShopStatus
      label: string
      removeLabel: string
    }

export type AppliedShopFilterTarget = Pick<AppliedShopFilterChip, 'facet' | 'value'>

const SHOP_STATUSES: ShopStatus[] = ['ACTIVE', 'CLOSED', 'UNVERIFIED']
const SHOP_STATUS_LABELS: Record<ShopStatus, string> = {
  ACTIVE: 'Open',
  CLOSED: 'Closed',
  UNVERIFIED: 'Unverified',
}

function parsePositiveInt(value: string | null) {
  if (value == null || !/^\d+$/.test(value)) {
    return undefined
  }

  const parsed = Number(value)
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : undefined
}

function parseCategoryIds(searchParams: URLSearchParams) {
  return parsePositiveIntList(searchParams, 'categoryIds')
}

function parseRegionIds(searchParams: URLSearchParams) {
  const regionIds = parsePositiveIntList(searchParams, 'regionIds')
  const legacyRegionId = parsePositiveInt(searchParams.get('regionId'))

  if (legacyRegionId == null || regionIds.includes(legacyRegionId)) {
    return regionIds
  }

  return [legacyRegionId, ...regionIds]
}

function parsePositiveIntList(searchParams: URLSearchParams, key: string) {
  const seen = new Set<number>()
  const values: number[] = []

  searchParams.getAll(key).forEach((value) => {
    const parsed = parsePositiveInt(value)

    if (parsed == null || seen.has(parsed)) {
      return
    }

    seen.add(parsed)
    values.push(parsed)
  })

  return values
}

function parseStatus(value: string | null) {
  return SHOP_STATUSES.find((status) => status === value)
}

export function parseShopFilters(searchParams: URLSearchParams): ShopFilters {
  return {
    regionIds: parseRegionIds(searchParams),
    categoryIds: parseCategoryIds(searchParams),
    workId: parsePositiveInt(searchParams.get('workId')),
    status: parseStatus(searchParams.get('status')),
  }
}

export function writeShopFilters(searchParams: URLSearchParams, filters: ShopFilters) {
  const next = new URLSearchParams(searchParams)

  next.delete('regionId')
  next.delete('regionIds')
  next.delete('categoryIds')
  next.delete('workId')
  next.delete('status')
  next.delete('page')

  filters.regionIds.forEach((regionId) => {
    next.append('regionIds', String(regionId))
  })

  filters.categoryIds.forEach((categoryId) => {
    next.append('categoryIds', String(categoryId))
  })

  if (filters.workId != null) {
    next.set('workId', String(filters.workId))
  }

  if (filters.status != null) {
    next.set('status', filters.status)
  }

  return next
}

type ShopFilterSearchParams = Pick<ShopSearchParams, 'regionIds' | 'categoryIds' | 'workIds' | 'status'>

export function toShopSearchParams(filters: ShopFilters): ShopFilterSearchParams {
  const regionIds = filters.regionIds.length > 0 ? filters.regionIds : undefined

  return {
    regionIds,
    categoryIds: filters.categoryIds.length > 0 ? filters.categoryIds : undefined,
    workIds: filters.workId != null ? [filters.workId] : undefined,
    status: filters.status,
  }
}

export function countShopFilters(filters: ShopFilters) {
  return (
    (filters.regionIds.length > 0 ? 1 : 0) +
    (filters.categoryIds.length > 0 ? 1 : 0) +
    (filters.workId != null ? 1 : 0) +
    (filters.status != null ? 1 : 0)
  )
}

export function buildAppliedShopFilterChips(
  filters: ShopFilters,
  facets?: ShopFacetResponse,
): AppliedShopFilterChip[] {
  const regionNameById = new Map(facets?.regions.map((region) => [region.id, region.name]) ?? [])
  const categoryNameById = new Map(facets?.categories.map((category) => [category.id, category.name]) ?? [])
  const chips: AppliedShopFilterChip[] = []

  filters.regionIds.forEach((regionId) => {
    const label = regionNameById.get(regionId) ?? `Region ${regionId}`

    chips.push({
      key: `region:${regionId}`,
      facet: 'region',
      value: regionId,
      label,
      removeLabel: `Remove ${label} filter`,
    })
  })

  filters.categoryIds.forEach((categoryId) => {
    const label = categoryNameById.get(categoryId) ?? `Category ${categoryId}`

    chips.push({
      key: `category:${categoryId}`,
      facet: 'category',
      value: categoryId,
      label,
      removeLabel: `Remove ${label} filter`,
    })
  })

  if (filters.status != null) {
    const label = SHOP_STATUS_LABELS[filters.status]

    chips.push({
      key: `status:${filters.status}`,
      facet: 'status',
      value: filters.status,
      label,
      removeLabel: `Remove ${label} filter`,
    })
  }

  return chips
}

export function removeAppliedShopFilterChip(filters: ShopFilters, chip: AppliedShopFilterTarget): ShopFilters {
  if (chip.facet === 'region') {
    return {
      ...filters,
      regionIds: filters.regionIds.filter((regionId) => regionId !== chip.value),
    }
  }

  if (chip.facet === 'category') {
    return {
      ...filters,
      categoryIds: filters.categoryIds.filter((categoryId) => categoryId !== chip.value),
    }
  }

  if (chip.facet === 'status') {
    return {
      ...filters,
      status: undefined,
    }
  }

  return filters
}
