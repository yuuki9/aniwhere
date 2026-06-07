import type { Shop } from '../api/types'

export type RecentViewedShop = {
  id: number
  name: string
  address: string
  regionName: string | null
  categories: string[]
  updatedAt: string | null
  viewedAt: string
  isFavorite: boolean
}

export type RecentViewedShopStorage = {
  getItem(key: string): Promise<string | null>
  setItem(key: string, value: string): Promise<void>
}

export type RecentViewedShopOptions = {
  isFavorite?: boolean
}

const RECENT_VIEWED_SHOPS_STORAGE_KEY = 'aniwhere-recent-viewed-shops'
const RECENT_VIEWED_SHOPS_LIMIT = 5

async function resolveRecentViewedShopStorage(storage?: RecentViewedShopStorage) {
  if (storage) {
    return storage
  }

  try {
    const module = await import('@apps-in-toss/web-framework')
    return module.Storage
  } catch {
    return null
  }
}

function isRecentViewedShop(value: unknown): value is RecentViewedShop {
  if (value == null || typeof value !== 'object') {
    return false
  }

  const item = value as RecentViewedShop
  return (
    Number.isSafeInteger(item.id) &&
    item.id > 0 &&
    typeof item.name === 'string' &&
    item.name.trim() !== '' &&
    typeof item.address === 'string' &&
    Array.isArray(item.categories) &&
    item.categories.every((category) => typeof category === 'string') &&
    (item.viewedAt == null || typeof item.viewedAt === 'string') &&
    (item.isFavorite == null || typeof item.isFavorite === 'boolean')
  )
}

function parseRecentViewedShops(raw: string | null) {
  if (raw == null || raw.trim() === '') {
    return []
  }

  try {
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) {
      return []
    }

    return parsed
      .filter(isRecentViewedShop)
      .map((item) => ({
        ...item,
        viewedAt: item.viewedAt ?? item.updatedAt ?? new Date().toISOString(),
        isFavorite: item.isFavorite === true,
      }))
      .slice(0, RECENT_VIEWED_SHOPS_LIMIT)
  } catch {
    return []
  }
}

export function toRecentViewedShop(shop: Shop): RecentViewedShop {
  return {
    id: shop.id,
    name: shop.name,
    address: shop.address,
    regionName: shop.regionName ?? null,
    categories: shop.categories.map((category) => category.name).filter((name) => name.trim() !== '').slice(0, 2),
    updatedAt: shop.updatedAt ?? null,
    viewedAt: new Date().toISOString(),
    isFavorite: false,
  }
}

export async function readRecentViewedShops(storage?: RecentViewedShopStorage) {
  const resolvedStorage = await resolveRecentViewedShopStorage(storage)
  if (resolvedStorage == null) {
    return []
  }

  try {
    return parseRecentViewedShops(await resolvedStorage.getItem(RECENT_VIEWED_SHOPS_STORAGE_KEY))
  } catch {
    return []
  }
}

export async function pushRecentViewedShop(
  shop: Shop,
  storage?: RecentViewedShopStorage,
  options: RecentViewedShopOptions = {},
) {
  const resolvedStorage = await resolveRecentViewedShopStorage(storage)
  if (resolvedStorage == null) {
    return
  }

  try {
    const nextShop = {
      ...toRecentViewedShop(shop),
      isFavorite: options.isFavorite === true,
    }
    const current = await readRecentViewedShops(resolvedStorage)
    const next = [nextShop, ...current.filter((item) => item.id !== nextShop.id)].slice(0, RECENT_VIEWED_SHOPS_LIMIT)

    await resolvedStorage.setItem(RECENT_VIEWED_SHOPS_STORAGE_KEY, JSON.stringify(next))
  } catch {
    // Recent-viewed data is a convenience layer. Runtime storage failures should not affect shop browsing.
  }
}
