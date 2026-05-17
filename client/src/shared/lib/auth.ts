import { getOperationalEnvironment } from '@apps-in-toss/web-framework'

export function isAppsInTossRuntime() {
  try {
    const environment = getOperationalEnvironment()
    return environment === 'toss' || environment === 'sandbox'
  } catch {
    return false
  }
}
