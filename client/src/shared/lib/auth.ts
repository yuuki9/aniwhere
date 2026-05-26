import { appLogin, getOperationalEnvironment } from '@apps-in-toss/web-framework'
import { toMaskedAuthorizationCode } from './authDebug'
import { toSafeErrorSummary } from './safeError'

export const TOSS_LOGIN_UNAVAILABLE_MESSAGE = '토스 앱에서 로그인해 주세요.'

export type EntryFlowResult =
  {
    mode: 'toss'
    authorizationCode: string
    referrer: 'DEFAULT' | 'SANDBOX'
  }

export function isAppsInTossRuntime() {
  try {
    const environment = getOperationalEnvironment()
    return environment === 'toss' || environment === 'sandbox'
  } catch {
    return false
  }
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

  console.info('[aniwhere:auth-debug] appLogin result', {
    authorizationCode: toMaskedAuthorizationCode(result.authorizationCode),
    referrer: result.referrer,
  })

  return {
    mode: 'toss',
    authorizationCode: result.authorizationCode,
    referrer: result.referrer,
  }
}
