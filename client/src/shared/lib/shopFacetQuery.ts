export const SHOP_FACET_STALE_TIME_MS = 1000 * 60 * 5
export const SHOP_FACET_GC_TIME_MS = 1000 * 60 * 30

export type ShopFacetQueryParams = {
  includeRegions?: boolean
  includeCategories?: boolean
  includeWorkTypes?: boolean
}

export function normalizeShopFacetQueryParams(params: ShopFacetQueryParams = {}): ShopFacetQueryParams {
  return {
    ...(params.includeRegions != null ? { includeRegions: params.includeRegions } : {}),
    ...(params.includeCategories != null ? { includeCategories: params.includeCategories } : {}),
    ...(params.includeWorkTypes != null ? { includeWorkTypes: params.includeWorkTypes } : {}),
  }
}

export function shopFacetQueryKey(params: ShopFacetQueryParams = {}) {
  return ['shops', 'facets', normalizeShopFacetQueryParams(params)] as const
}
