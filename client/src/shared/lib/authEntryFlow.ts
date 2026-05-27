import { tossLogin } from '../api/auth'
import { checkNicknameAvailability, getMyProfile, updateMyNickname } from '../api/users'
import type { LoginResult, NicknameAvailabilityResult, UserSummary } from '../api/types'
import type { EntryFlowResult } from './auth'
import { createAuthSession, saveAuthSession, updateAuthSessionUser, type AuthSession } from './authSession'
import { toSafeErrorSummary } from './safeError'

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

type SaveNicknameDeps = {
  checkNicknameAvailability: (nickname: string, accessToken: string) => Promise<NicknameAvailabilityResult>
  updateMyNickname: (payload: { nickname: string }, accessToken: string) => Promise<UserSummary>
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
  deps: SaveNicknameDeps = defaultSaveNicknameDeps,
) {
  const nickname = validateAniwhereNickname(rawNickname)
  const availability = await deps.checkNicknameAvailability(nickname, accessToken)
  if (!availability.available) {
    throw new Error('이미 사용 중인 닉네임이에요.')
  }

  const user = await deps.updateMyNickname({ nickname }, accessToken)
  deps.updateSessionUser(user)
  return user
}
