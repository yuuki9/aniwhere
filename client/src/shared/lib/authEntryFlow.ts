import { refreshAuth, tossLogin } from '../api/auth'
import { checkNicknameAvailability, getMyProfile, updateMyNickname } from '../api/users'
import type { LoginResult, NicknameAvailabilityResult, RefreshResult, UpdateNicknamePayload, UserSummary } from '../api/types'
import type { EntryFlowResult } from './auth'
import {
  clearAuthSession,
  createAuthSession,
  readAuthSession,
  saveAuthSession,
  updateAuthSessionUser,
  type AuthSession,
} from './authSession'
import { toSafeErrorSummary } from './safeError'

const ACCESS_TOKEN_EXPIRY_SKEW_SECONDS = 30

export type EntrySessionResult =
  | {
      mode: 'ready'
      session: AuthSession
      user: UserSummary
    }
  | {
      mode: 'needsNickname'
      session: AuthSession
      user: UserSummary
    }

type CompleteServiceEntryDeps = {
  login: (payload: { authorizationCode: string; referrer: string }) => Promise<LoginResult>
  getProfile: (accessToken: string) => Promise<UserSummary>
  saveSession: (session: AuthSession) => void
}

const defaultCompleteServiceEntryDeps: CompleteServiceEntryDeps = {
  login: tossLogin,
  getProfile: getMyProfile,
  saveSession: saveAuthSession,
}

type ResumeStoredServiceEntryDeps = {
  now: () => number
  readSession: () => AuthSession | null
  refresh: (payload: { refreshToken: string }) => Promise<RefreshResult>
  getProfile: (accessToken: string) => Promise<UserSummary>
  saveSession: (session: AuthSession) => void
  clearSession: () => void
}

const defaultResumeStoredServiceEntryDeps: ResumeStoredServiceEntryDeps = {
  now: Date.now,
  readSession: readAuthSession,
  refresh: refreshAuth,
  getProfile: getMyProfile,
  saveSession: saveAuthSession,
  clearSession: clearAuthSession,
}

function normalizeTossLoginReferrerForServer(value: string): string {
  const normalized = value.trim()
  return normalized.toUpperCase() === 'SANDBOX' ? 'sandbox' : normalized
}

export async function completeServiceEntry(
  entry: EntryFlowResult,
  deps: CompleteServiceEntryDeps = defaultCompleteServiceEntryDeps,
): Promise<EntrySessionResult> {
  let login: LoginResult
  const loginPayload = {
    authorizationCode: entry.authorizationCode,
    referrer: normalizeTossLoginReferrerForServer(entry.referrer),
  }

  try {
    login = await deps.login(loginPayload)
  } catch (error) {
    console.error('[aniwhere:auth-entry] server login failed', {
      error: toSafeErrorSummary(error),
      referrer: loginPayload.referrer,
    })
    throw error
  }

  let user: UserSummary
  try {
    user = await deps.getProfile(login.accessToken)
  } catch (error) {
    console.error('[aniwhere:auth-entry] profile fetch failed', { error: toSafeErrorSummary(error) })
    throw error
  }

  const session = createAuthSession(login, user)
  deps.saveSession(session)

  if (login.isNewUser || user.nickname == null || user.nickname.trim() === '') {
    return { mode: 'needsNickname', session, user }
  }

  return { mode: 'ready', session, user }
}

function hasNamedUser(user: UserSummary | null): user is UserSummary & { nickname: string } {
  return user?.nickname != null && user.nickname.trim() !== ''
}

function isAccessTokenFresh(session: AuthSession, nowMs: number) {
  return session.accessTokenExpiresAt > Math.floor(nowMs / 1000) + ACCESS_TOKEN_EXPIRY_SKEW_SECONDS
}

function classifySession(session: AuthSession, user: UserSummary): EntrySessionResult {
  if (hasNamedUser(user)) {
    return { mode: 'ready', session, user }
  }

  return { mode: 'needsNickname', session, user }
}

async function refreshStoredSession(
  session: AuthSession,
  deps: ResumeStoredServiceEntryDeps,
): Promise<AuthSession> {
  const refreshed = await deps.refresh({ refreshToken: session.refreshToken })

  return {
    ...session,
    accessToken: refreshed.accessToken,
    refreshToken: refreshed.refreshToken,
    accessTokenExpiresAt: refreshed.expiresIn,
  }
}

async function loadProfileIntoSession(session: AuthSession, deps: ResumeStoredServiceEntryDeps) {
  const user = await deps.getProfile(session.accessToken)
  const nextSession = { ...session, role: user.role, user }
  deps.saveSession(nextSession)

  return classifySession(nextSession, user)
}

export async function resumeStoredServiceEntry(
  deps: ResumeStoredServiceEntryDeps = defaultResumeStoredServiceEntryDeps,
): Promise<EntrySessionResult | null> {
  const storedSession = deps.readSession()

  if (storedSession == null) {
    return null
  }

  if (isAccessTokenFresh(storedSession, deps.now())) {
    if (hasNamedUser(storedSession.user)) {
      return { mode: 'ready', session: storedSession, user: storedSession.user }
    }

    try {
      return await loadProfileIntoSession(storedSession, deps)
    } catch (error) {
      console.error('[aniwhere:auth-entry] stored profile fetch failed', { error: toSafeErrorSummary(error) })
      return classifySession(storedSession, storedSession.user)
    }
  }

  let refreshedSession: AuthSession
  try {
    refreshedSession = await refreshStoredSession(storedSession, deps)
  } catch (error) {
    console.error('[aniwhere:auth-entry] stored session refresh failed', { error: toSafeErrorSummary(error) })
    deps.clearSession()
    return null
  }

  deps.saveSession(refreshedSession)

  try {
    return await loadProfileIntoSession(refreshedSession, deps)
  } catch (error) {
    console.error('[aniwhere:auth-entry] stored profile sync failed', { error: toSafeErrorSummary(error) })
    return classifySession(refreshedSession, refreshedSession.user)
  }
}

type SaveNicknameDeps = {
  checkNicknameAvailability: (nickname: string, accessToken: string) => Promise<NicknameAvailabilityResult>
  updateMyNickname: (payload: UpdateNicknamePayload, accessToken: string) => Promise<UserSummary>
  updateSessionUser: (user: UserSummary) => void
}

const defaultSaveNicknameDeps: SaveNicknameDeps = {
  checkNicknameAvailability,
  updateMyNickname,
  updateSessionUser: updateAuthSessionUser,
}

export function normalizeAniwhereNickname(raw: string) {
  return raw.trim()
}

export function validateAniwhereNickname(raw: string) {
  const nickname = normalizeAniwhereNickname(raw)
  if (nickname === '') {
    throw new Error('닉네임을 입력해 주세요.')
  }
  if (nickname.length > 50) {
    throw new Error('닉네임은 50자 이내로 입력해 주세요.')
  }
  return nickname
}

export async function saveAniwhereNickname(
  rawNickname: string,
  accessToken: string,
  emojiIconFilename?: string | null,
  deps: SaveNicknameDeps = defaultSaveNicknameDeps,
) {
  const nickname = validateAniwhereNickname(rawNickname)
  const availability = await deps.checkNicknameAvailability(nickname, accessToken)
  if (!availability.available) {
    throw new Error('이미 사용 중인 닉네임이에요.')
  }

  const user = await deps.updateMyNickname({ nickname, emojiIconFilename }, accessToken)
  deps.updateSessionUser(user)
  return user
}
