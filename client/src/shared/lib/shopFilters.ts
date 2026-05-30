import type { ShopFacetResponse, ShopSearchParams, ShopSort, ShopStatus, WorkType } from '../api/types'

export type ShopFilters = {
  regionIds: number[]
  categoryIds: number[]
  workId?: number
  workType?: WorkType
  status?: ShopStatus
  sort?: ShopSort
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
      facet: 'workType'
      value: WorkType
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
  | {
      key: string
      facet: 'sort'
      value: ShopSort
      label: string
      removeLabel: string
    }

export type AppliedShopFilterTarget = Pick<AppliedShopFilterChip, 'facet' | 'value'>

const SHOP_STATUSES: ShopStatus[] = ['ACTIVE', 'CLOSED', 'UNVERIFIED']
const SHOP_SORTS: ShopSort[] = ['NEWEST', 'REVIEW_COUNT_DESC', 'FAVORITE_COUNT_DESC']
const WORK_TYPES: WorkType[] = ['ANIMATION', 'GAME']
const SHOP_SORT_LABELS: Record<ShopSort, string> = {
  NEWEST: '최신순',
  REVIEW_COUNT_DESC: '리뷰 많은순',
  FAVORITE_COUNT_DESC: '관심 많은순',
}

export function getShopSortLabel(sort: ShopSort) {
  return SHOP_SORT_LABELS[sort]
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

function parseSort(value: string | null) {
  const sort = SHOP_SORTS.find((candidate) => candidate === value)

  return sort === 'NEWEST' ? undefined : sort
}

function parseWorkType(value: string | null) {
  return WORK_TYPES.find((workType) => workType === value)
}

export function parseShopFilters(searchParams: URLSearchParams): ShopFilters {
  return {
    regionIds: parseRegionIds(searchParams),
    categoryIds: parseCategoryIds(searchParams),
    workId: parsePositiveInt(searchParams.get('workId')),
    workType: parseWorkType(searchParams.get('workType')),
    status: parseStatus(searchParams.get('status')),
    sort: parseSort(searchParams.get('sort')),
  }
}

export function writeShopFilters(searchParams: URLSearchParams, filters: ShopFilters) {
  const next = new URLSearchParams(searchParams)

  next.delete('regionId')
  next.delete('regionIds')
  next.delete('categoryIds')
  next.delete('workId')
  next.delete('workType')
  next.delete('status')
  next.delete('sort')
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

  if (filters.workType != null) {
    next.set('workType', filters.workType)
  }

  if (filters.status != null) {
    next.set('status', filters.status)
  }

  if (filters.sort != null) {
    next.set('sort', filters.sort)
  }

  return next
}

type ShopFilterSearchParams = Pick<ShopSearchParams, 'regionIds' | 'categoryIds' | 'workIds' | 'workType' | 'status' | 'sort'>

export function toShopSearchParams(filters: ShopFilters): ShopFilterSearchParams {
  const regionIds = filters.regionIds.length > 0 ? filters.regionIds : undefined
  const params: ShopFilterSearchParams = {
    regionIds,
    categoryIds: filters.categoryIds.length > 0 ? filters.categoryIds : undefined,
    workIds: filters.workId != null ? [filters.workId] : undefined,
    workType: filters.workType,
    status: filters.status,
  }

  if (filters.sort != null) {
    params.sort = filters.sort
  }

  return params
}

export function countShopFilters(filters: ShopFilters) {
  return (
    filters.regionIds.length +
    filters.categoryIds.length +
    (filters.workId != null ? 1 : 0) +
    (filters.workType != null ? 1 : 0) +
    (filters.status != null ? 1 : 0) +
    (filters.sort != null ? 1 : 0)
  )
}

export function buildAppliedShopFilterChips(
  filters: ShopFilters,
  facets?: ShopFacetResponse,
): AppliedShopFilterChip[] {
  const regionNameById = new Map(facets?.regions.map((region) => [region.id, region.name]) ?? [])
  const categoryNameById = new Map(facets?.categories.map((category) => [category.id, category.name]) ?? [])
  const workTypeLabelByValue = new Map(facets?.workTypes.map((workType) => [workType.value, workType.label]) ?? [])
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

  if (filters.workType != null) {
    const label = workTypeLabelByValue.get(filters.workType) ?? filters.workType

    chips.push({
      key: `workType:${filters.workType}`,
      facet: 'workType',
      value: filters.workType,
      label,
      removeLabel: `Remove ${label} filter`,
    })
  }

  if (filters.sort != null) {
    const label = getShopSortLabel(filters.sort)

    chips.push({
      key: `sort:${filters.sort}`,
      facet: 'sort',
      value: filters.sort,
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

  if (chip.facet === 'workType') {
    return {
      ...filters,
      workType: undefined,
    }
  }

  if (chip.facet === 'status') {
    return {
      ...filters,
      status: undefined,
    }
  }

  if (chip.facet === 'sort') {
    return {
      ...filters,
      sort: undefined,
    }
  }

  return filters
}
