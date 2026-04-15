import { appLogin, getOperationalEnvironment } from '@apps-in-toss/web-framework'

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

  const result = await appLogin()

  return {
    mode: 'toss',
    authorizationCode: result.authorizationCode,
    referrer: result.referrer,
  }
}
