import type { ShopStatus } from '../../shared/api/types'

export type AdminShopDraft = {
  name: string
  addressQuery: string
  address: string
  px: number | null
  py: number | null
  floor: string
  regionId: number | null
  status: ShopStatus
  sellsIchibanKuji: boolean
  visitTip: string
}

export type AdminShopSelectedLocation = {
  address: string
  px: number
  py: number
  regionId: number | null
}

const ADMIN_SHOP_DRAFT_STORAGE_KEY = 'aniwhere.admin.shop-create-draft.v1'
const ADMIN_SHOP_LOCATION_STORAGE_KEY = 'aniwhere.admin.shop-create-location.v1'

let pendingShopFiles: File[] = []

function readJson<T>(key: string): T | null {
  if (typeof window === 'undefined') {
    return null
  }

  try {
    const raw = window.sessionStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : null
  } catch {
    return null
  }
}

function writeJson<T>(key: string, value: T) {
  if (typeof window === 'undefined') {
    return
  }

  window.sessionStorage.setItem(key, JSON.stringify(value))
}

export function readAdminShopDraft() {
  return readJson<AdminShopDraft>(ADMIN_SHOP_DRAFT_STORAGE_KEY)
}

export function writeAdminShopDraft(draft: AdminShopDraft) {
  writeJson(ADMIN_SHOP_DRAFT_STORAGE_KEY, draft)
}

export function clearAdminShopDraft() {
  if (typeof window === 'undefined') {
    return
  }

  window.sessionStorage.removeItem(ADMIN_SHOP_DRAFT_STORAGE_KEY)
  window.sessionStorage.removeItem(ADMIN_SHOP_LOCATION_STORAGE_KEY)
}

export function readAdminShopSelectedLocation() {
  return readJson<AdminShopSelectedLocation>(ADMIN_SHOP_LOCATION_STORAGE_KEY)
}

export function writeAdminShopSelectedLocation(location: AdminShopSelectedLocation) {
  writeJson(ADMIN_SHOP_LOCATION_STORAGE_KEY, location)
}

export function clearAdminShopSelectedLocation() {
  if (typeof window === 'undefined') {
    return
  }

  window.sessionStorage.removeItem(ADMIN_SHOP_LOCATION_STORAGE_KEY)
}

export function readPendingAdminShopFiles() {
  return pendingShopFiles
}

export function writePendingAdminShopFiles(files: File[]) {
  pendingShopFiles = files
}

export function clearPendingAdminShopFiles() {
  pendingShopFiles = []
}
