import { appLogin, getOperationalEnvironment } from '@apps-in-toss/web-framework'
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
    return { mode: 'preview' }
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
