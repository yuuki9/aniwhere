import { Storage, loadFullScreenAd, showFullScreenAd } from '@apps-in-toss/web-bridge'
import { isAppsInTossRuntime } from './auth'

type TossAdKind = 'banner' | 'interstitial' | 'rewarded'
type FullScreenAdState = {
  isLoaded: boolean
  isLoading: boolean
  loadingPromise: Promise<boolean> | null
}

type ShopViewAdStorageState = {
  viewedShopIds: number[]
  shownMilestones: number[]
}

export type ReviewRewardedAdResult =
  | { status: 'UNSUPPORTED' }
  | { status: 'NOT_LOADED' }
  | { status: 'DISMISSED' }
  | { status: 'EARNED'; unitType: string; unitAmount: number }
  | { status: 'ERROR'; message: string }

const SHOP_VIEW_AD_STATE_KEY = 'aniwhere-ad-shop-view-state-v1'
const SHOP_VIEW_INTERSTITIAL_THRESHOLD = 5
const SHOP_VIEW_STATE_LIMIT = 30
const FULL_SCREEN_AD_STATES = new Map<TossAdKind, FullScreenAdState>()

const TEST_AD_GROUP_IDS: Record<TossAdKind, string> = {
  banner: 'ait-ad-test-banner-id',
  interstitial: 'ait-ad-test-interstitial-id',
  rewarded: 'ait-ad-test-rewarded-id',
}

const DEFAULT_AD_GROUP_IDS: Record<TossAdKind, string> = {
  banner: 'ait.v2.live.c081b1ff483d4815',
  interstitial: 'ait.v2.live.f9baf4bc925644c4',
  rewarded: 'ait.v2.live.7a44e77025474da9',
}

const AD_GROUP_ENV_KEYS: Record<TossAdKind, string> = {
  banner: 'VITE_TOSS_AD_BANNER_GROUP_ID',
  interstitial: 'VITE_TOSS_AD_INTERSTITIAL_GROUP_ID',
  rewarded: 'VITE_TOSS_AD_REWARDED_GROUP_ID',
}

export function getEnvValue(key: string) {
  const value = import.meta.env[key]
  return typeof value === 'string' && value.trim() !== '' ? value.trim() : null
}

export function getTossAdGroupId(kind: TossAdKind) {
  if (getEnvValue('VITE_TOSS_AD_USE_TEST_IDS') === 'true') {
    return TEST_AD_GROUP_IDS[kind]
  }

  return getEnvValue(AD_GROUP_ENV_KEYS[kind]) ?? (import.meta.env.DEV ? TEST_AD_GROUP_IDS[kind] : DEFAULT_AD_GROUP_IDS[kind])
}

export function isSupported(check: () => boolean) {
  try {
    return isAppsInTossRuntime() && check()
  } catch {
    return false
  }
}

function getFullScreenAdState(kind: TossAdKind) {
  const current = FULL_SCREEN_AD_STATES.get(kind)
  if (current) {
    return current
  }

  const next: FullScreenAdState = {
    isLoaded: false,
    isLoading: false,
    loadingPromise: null,
  }
  FULL_SCREEN_AD_STATES.set(kind, next)
  return next
}

function parseShopViewAdState(raw: string | null): ShopViewAdStorageState {
  if (raw == null || raw.trim() === '') {
    return { viewedShopIds: [], shownMilestones: [] }
  }

  try {
    const parsed = JSON.parse(raw) as Partial<ShopViewAdStorageState>
    return {
      viewedShopIds: Array.isArray(parsed.viewedShopIds)
        ? parsed.viewedShopIds.filter((id) => Number.isSafeInteger(id) && id > 0).slice(0, SHOP_VIEW_STATE_LIMIT)
        : [],
      shownMilestones: Array.isArray(parsed.shownMilestones)
        ? parsed.shownMilestones.filter((count) => Number.isSafeInteger(count) && count > 0)
        : [],
    }
  } catch {
    return { viewedShopIds: [], shownMilestones: [] }
  }
}

async function readShopViewAdState() {
  try {
    return parseShopViewAdState(await Storage.getItem(SHOP_VIEW_AD_STATE_KEY))
  } catch {
    return { viewedShopIds: [], shownMilestones: [] }
  }
}

async function writeShopViewAdState(state: ShopViewAdStorageState) {
  try {
    await Storage.setItem(SHOP_VIEW_AD_STATE_KEY, JSON.stringify(state))
  } catch {
    // Ad frequency state is best-effort and must never block shop browsing.
  }
}

export function isReviewRewardedAdPromptEnabled() {
  return getEnvValue('VITE_ENABLE_REVIEW_REWARDED_AD') === 'true' && getTossAdGroupId('rewarded') != null
}

export function preloadTossFullScreenAd(kind: Exclude<TossAdKind, 'banner'>) {
  const adGroupId = getTossAdGroupId(kind)
  const state = getFullScreenAdState(kind)

  if (adGroupId == null || !isSupported(loadFullScreenAd.isSupported)) {
    return Promise.resolve(false)
  }

  if (state.isLoaded) {
    return Promise.resolve(true)
  }

  if (state.loadingPromise) {
    return state.loadingPromise
  }

  state.isLoading = true
  state.loadingPromise = new Promise<boolean>((resolve) => {
    let didResolve = false
    const finish = (isLoaded: boolean) => {
      if (didResolve) {
        return
      }

      didResolve = true
      state.isLoaded = isLoaded
      state.isLoading = false
      state.loadingPromise = null
      resolve(isLoaded)
    }
    const unregister = loadFullScreenAd({
      options: { adGroupId },
      onEvent: (event) => {
        if (event.type === 'loaded') {
          finish(true)
        }
      },
      onError: () => finish(false),
    })

    window.setTimeout(() => {
      unregister()
      finish(false)
    }, 8_000)
  })

  return state.loadingPromise
}

export async function maybeShowShopViewInterstitial(shopId: number) {
  const adGroupId = getTossAdGroupId('interstitial')

  if (adGroupId == null || !isSupported(showFullScreenAd.isSupported)) {
    return false
  }

  const current = await readShopViewAdState()
  const viewedShopIds = [shopId, ...current.viewedShopIds.filter((id) => id !== shopId)].slice(0, SHOP_VIEW_STATE_LIMIT)
  const viewedCount = viewedShopIds.length
  const shouldShow =
    viewedCount >= SHOP_VIEW_INTERSTITIAL_THRESHOLD &&
    viewedCount % SHOP_VIEW_INTERSTITIAL_THRESHOLD === 0 &&
    !current.shownMilestones.includes(viewedCount)
  const shownMilestones = shouldShow ? [...current.shownMilestones, viewedCount] : current.shownMilestones

  await writeShopViewAdState({ viewedShopIds, shownMilestones })

  if (!shouldShow) {
    void preloadTossFullScreenAd('interstitial')
    return false
  }

  const isLoaded = await preloadTossFullScreenAd('interstitial')
  if (!isLoaded) {
    return false
  }

  const state = getFullScreenAdState('interstitial')
  state.isLoaded = false

  let unregister: (() => void) | null = null
  unregister = showFullScreenAd({
    options: { adGroupId },
    onEvent: (event) => {
      if (event.type === 'dismissed' || event.type === 'failedToShow') {
        unregister?.()
        void preloadTossFullScreenAd('interstitial')
      }
    },
    onError: () => {
      unregister?.()
      void preloadTossFullScreenAd('interstitial')
    },
  })

  return true
}

export async function showReviewRewardedAd(): Promise<ReviewRewardedAdResult> {
  const adGroupId = getTossAdGroupId('rewarded')

  if (adGroupId == null || !isSupported(showFullScreenAd.isSupported)) {
    return { status: 'UNSUPPORTED' }
  }

  const isLoaded = await preloadTossFullScreenAd('rewarded')
  if (!isLoaded) {
    return { status: 'NOT_LOADED' }
  }

  const state = getFullScreenAdState('rewarded')
  state.isLoaded = false

  return new Promise<ReviewRewardedAdResult>((resolve) => {
    let didResolve = false
    let unregister: (() => void) | null = null
    const finish = (result: ReviewRewardedAdResult) => {
      if (didResolve) {
        return
      }

      didResolve = true
      unregister?.()
      void preloadTossFullScreenAd('rewarded')
      resolve(result)
    }

    unregister = showFullScreenAd({
      options: { adGroupId },
      onEvent: (event) => {
        if (event.type === 'userEarnedReward') {
          finish({
            status: 'EARNED',
            unitType: event.data.unitType,
            unitAmount: event.data.unitAmount,
          })
        }

        if (event.type === 'dismissed') {
          finish({ status: 'DISMISSED' })
        }

        if (event.type === 'failedToShow') {
          finish({ status: 'ERROR', message: '광고를 표시하지 못했어요.' })
        }
      },
      onError: (error) => {
        finish({
          status: 'ERROR',
          message: error instanceof Error ? error.message : '광고를 표시하지 못했어요.',
        })
      },
    })
  })
}
