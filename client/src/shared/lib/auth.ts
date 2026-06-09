import { appLogin, getOperationalEnvironment } from '@apps-in-toss/web-framework'
import { toSafeErrorSummary } from './safeError'

export const TOSS_LOGIN_UNAVAILABLE_MESSAGE = '토스 앱에서 로그인해 주세요.'

export type AppsInTossOperationalEnvironment = 'toss' | 'sandbox'

export type EntryFlowResult =
  {
    mode: 'toss'
    authorizationCode: string
    referrer: 'DEFAULT' | 'SANDBOX'
  }

export function getAppsInTossOperationalEnvironment(): AppsInTossOperationalEnvironment | null {
  try {
    const environment = getOperationalEnvironment()
    return environment === 'toss' || environment === 'sandbox' ? environment : null
  } catch {
    return null
  }
}

export function isAppsInTossRuntime() {
  return getAppsInTossOperationalEnvironment() != null
}

export async function startServiceEntry(): Promise<EntryFlowResult> {
  if (!isAppsInTossRuntime()) {
    throw new Error(TOSS_LOGIN_UNAVAILABLE_MESSAGE)
  }

  let result: Awaited<ReturnType<typeof appLogin>>
  try {
    result = await appLogin()
  } catch (error) {
    console.error('[aniwhere:auth] appLogin failed', toSafeErrorSummary(error))
    throw error
  }

  return {
    mode: 'toss',
    authorizationCode: result.authorizationCode,
    referrer: result.referrer,
  }
}
