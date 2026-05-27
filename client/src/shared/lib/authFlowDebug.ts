import { maskSecretForLog } from './logMasking'
import type { LoginResult, UserSummary } from '../api/types'

export function logAuthFlow(scope: 'auth' | 'auth-entry' | 'intro', step: string, details?: Record<string, unknown>) {
  console.info(`[aniwhere:${scope}]`, { step, ...details })
}

export function logAuthFlowError(
  scope: 'auth' | 'auth-entry' | 'intro',
  step: string,
  error: unknown,
  details?: Record<string, unknown>,
) {
  console.error(`[aniwhere:${scope}]`, { step, ...details, error })
}

export function summarizeLoginResult(login: LoginResult) {
  return {
    expiresIn: login.expiresIn,
    role: login.role,
    isNewUser: login.isNewUser,
    accessToken: maskSecretForLog(login.accessToken),
    refreshToken: maskSecretForLog(login.refreshToken),
  }
}

export function summarizeUserProfile(user: UserSummary) {
  return {
    id: user.id,
    userKey: user.userKey,
    status: user.status,
    hasNickname: user.nickname != null && user.nickname.trim() !== '',
  }
}
