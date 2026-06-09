import { getAppsInTossOperationalEnvironment, isAppsInTossRuntime } from './auth'

type TossAdKind = 'banner'

const TEST_AD_GROUP_IDS: Record<TossAdKind, string> = {
  banner: 'ait-ad-test-banner-id',
}

const DEFAULT_AD_GROUP_IDS: Record<TossAdKind, string> = {
  banner: 'ait.v2.live.c081b1ff483d4815',
}

const AD_GROUP_ENV_KEYS: Record<TossAdKind, string> = {
  banner: 'VITE_TOSS_AD_BANNER_GROUP_ID',
}

export function getEnvValue(key: string) {
  const value = import.meta.env[key]
  return typeof value === 'string' && value.trim() !== '' ? value.trim() : null
}

function getCurrentHostname() {
  return typeof window !== 'undefined' ? window.location.hostname : ''
}

function isAppsInTossConsolePreviewHost(hostname: string) {
  return hostname === 'private-apps.tossmini.com' || hostname.endsWith('.private-apps.tossmini.com')
}

function getConfiguredOrDefaultAdGroupId(kind: TossAdKind) {
  const configuredAdGroupId = getEnvValue(AD_GROUP_ENV_KEYS[kind])
  if (configuredAdGroupId != null) {
    return configuredAdGroupId
  }

  if (getEnvValue('VITE_TOSS_AD_USE_LIVE_DEFAULTS') === 'true') {
    return DEFAULT_AD_GROUP_IDS[kind]
  }

  return DEFAULT_AD_GROUP_IDS[kind]
}

export function getTossAdGroupId(kind: TossAdKind) {
  if (getEnvValue('VITE_TOSS_AD_USE_TEST_IDS') === 'true') {
    return TEST_AD_GROUP_IDS[kind]
  }

  if (getEnvValue('VITE_TOSS_AD_USE_LIVE_IDS') === 'true') {
    return getConfiguredOrDefaultAdGroupId(kind)
  }

  const runtimeEnvironment = getAppsInTossOperationalEnvironment()
  if (runtimeEnvironment === 'sandbox' || isAppsInTossConsolePreviewHost(getCurrentHostname())) {
    return TEST_AD_GROUP_IDS[kind]
  }

  return getConfiguredOrDefaultAdGroupId(kind)
}

export function isTossMockBannerEnabled() {
  if (getEnvValue('VITE_TOSS_AD_USE_MOCK_BANNER') === 'true') {
    return true
  }

  if (typeof window === 'undefined') {
    return false
  }

  try {
    const params = new URLSearchParams(window.location.search)
    const mockValue = params.get('mockAdBanner')

    if (mockValue === '1') {
      window.sessionStorage.setItem('aniwhere-mock-ad-banner', '1')
      return true
    }

    if (mockValue === '0') {
      window.sessionStorage.removeItem('aniwhere-mock-ad-banner')
      return false
    }

    return window.sessionStorage.getItem('aniwhere-mock-ad-banner') === '1'
  } catch {
    return false
  }
}

export function isSupported(check: () => boolean) {
  try {
    return isAppsInTossRuntime() && check()
  } catch {
    return false
  }
}
