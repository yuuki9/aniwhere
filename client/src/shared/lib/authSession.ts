import type { LoginResult, UserSummary } from '../api/types'
import { toSafeErrorSummary } from './safeError'

const AUTH_SESSION_STORAGE_KEY = 'aniwhere.auth.session.v1'

export type AuthSession = {
  accessToken: string
  refreshToken: string
  accessTokenExpiresAt: number
  role: string
  user: UserSummary | null
}

export function createAuthSession(login: LoginResult, user: UserSummary | null): AuthSession {
  return {
    accessToken: login.accessToken,
    refreshToken: login.refreshToken,
    accessTokenExpiresAt: login.expiresIn,
    role: login.role,
    user,
  }
}

export function readAuthSession(): AuthSession | null {
  if (typeof window === 'undefined') {
    return null
  }

  try {
    const raw = window.localStorage.getItem(AUTH_SESSION_STORAGE_KEY)
    if (raw == null) {
      return null
    }

    const parsed = JSON.parse(raw) as Partial<AuthSession>
    if (typeof parsed.accessToken !== 'string' || typeof parsed.refreshToken !== 'string') {
      return null
    }

    return {
      accessToken: parsed.accessToken,
      refreshToken: parsed.refreshToken,
      accessTokenExpiresAt: typeof parsed.accessTokenExpiresAt === 'number' ? parsed.accessTokenExpiresAt : 0,
      role: typeof parsed.role === 'string' ? parsed.role : 'ROLE_USER',
      user: parsed.user ?? null,
    }
  } catch {
    return null
  }
}

export function saveAuthSession(session: AuthSession) {
  if (typeof window === 'undefined') {
    return
  }

  try {
    window.localStorage.setItem(AUTH_SESSION_STORAGE_KEY, JSON.stringify(session))
  } catch (error) {
    console.error('[aniwhere:auth-session] save failed', toSafeErrorSummary(error))
  }
}

export function updateAuthSessionUser(user: UserSummary) {
  const session = readAuthSession()
  if (session == null) {
    return
  }

  saveAuthSession({ ...session, user })
}

export function isAdminRole(role: string | null | undefined) {
  const normalized = role?.trim().toUpperCase()
  return normalized === 'ADMIN' || normalized === 'ROLE_ADMIN' || normalized?.endsWith('_ADMIN') === true
}

export function getStoredAccessToken() {
  return readAuthSession()?.accessToken ?? null
}

export function clearAuthSession() {
  if (typeof window === 'undefined') {
    return
  }

  try {
    window.localStorage.removeItem(AUTH_SESSION_STORAGE_KEY)
  } catch (error) {
    console.error('[aniwhere:auth-session] clear failed', toSafeErrorSummary(error))
  }
}
