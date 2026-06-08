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

export function getTossAdGroupId(kind: TossAdKind) {
  if (getEnvValue('VITE_TOSS_AD_USE_TEST_IDS') === 'true') {
    return TEST_AD_GROUP_IDS[kind]
  }

  const configuredAdGroupId = getEnvValue(AD_GROUP_ENV_KEYS[kind])
  if (configuredAdGroupId != null) {
    return configuredAdGroupId
  }

  if (getEnvValue('VITE_TOSS_AD_USE_LIVE_DEFAULTS') === 'true') {
    return DEFAULT_AD_GROUP_IDS[kind]
  }

  return DEFAULT_AD_GROUP_IDS[kind]
}

export function getTossAdSupportStatus(check: () => boolean) {
  try {
    return check()
      ? ({ supported: true } as const)
      : ({ reason: 'sdk-not-supported', supported: false } as const)
  } catch (error) {
    return {
      error,
      reason: 'support-check-failed',
      supported: false,
    } as const
  }
}

export function isSupported(check: () => boolean) {
  return getTossAdSupportStatus(check).supported
}
