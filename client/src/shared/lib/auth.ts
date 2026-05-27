import { appLogin, getOperationalEnvironment } from '@apps-in-toss/web-framework'
import { logAuthFlow, logAuthFlowError } from './authFlowDebug'
import { toSafeErrorSummary } from './safeError'

export type EntryFlowResult =
  | {
      mode: 'toss'
      authorizationCode: string
      referrer: 'DEFAULT' | 'SANDBOX'
    }
  | {
      mode: 'preview'
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
    logAuthFlow('auth', 'runtime-preview')
    return { mode: 'preview' }
  }

  const environment = getOperationalEnvironment()
  logAuthFlow('auth', 'appLogin-start', { operationalEnvironment: environment })

  let result: Awaited<ReturnType<typeof appLogin>>
  try {
    result = await appLogin()
  } catch (error) {
    logAuthFlowError('auth', 'appLogin-failed', toSafeErrorSummary(error))
    throw error
  }

  logAuthFlow('auth', 'appLogin-ok', { referrer: result.referrer })

  return {
    mode: 'toss',
    authorizationCode: result.authorizationCode,
    referrer: result.referrer,
  }
}
