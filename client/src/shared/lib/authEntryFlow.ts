import { tossLogin } from '../api/auth'
import { checkNicknameAvailability, getMyProfile, updateMyNickname } from '../api/users'
import type { LoginResult, NicknameAvailabilityResult, UserSummary } from '../api/types'
import type { EntryFlowResult } from './auth'
import {
  logAuthFlow,
  logAuthFlowError,
  summarizeLoginResult,
  summarizeUserProfile,
} from './authFlowDebug'
import { createAuthSession, saveAuthSession, updateAuthSessionUser, type AuthSession } from './authSession'
import { toSafeErrorSummary } from './safeError'

export type EntrySessionResult =
  | {
      mode: 'preview'
    }
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

export async function completeServiceEntry(
  entry: EntryFlowResult,
  deps: CompleteServiceEntryDeps = defaultCompleteServiceEntryDeps,
): Promise<EntrySessionResult> {
  if (entry.mode === 'preview') {
    logAuthFlow('auth-entry', 'preview-skip')
    return { mode: 'preview' }
  }

  logAuthFlow('auth-entry', 'server-login-start', { referrer: entry.referrer })

  let login: LoginResult
  try {
    login = await deps.login({
      authorizationCode: entry.authorizationCode,
      referrer: entry.referrer,
    })
  } catch (error) {
    logAuthFlowError('auth-entry', 'server-login-failed', toSafeErrorSummary(error), {
      referrer: entry.referrer,
    })
    throw error
  }

  logAuthFlow('auth-entry', 'server-login-ok', summarizeLoginResult(login))

  logAuthFlow('auth-entry', 'profile-fetch-start')
  let user: UserSummary
  try {
    user = await deps.getProfile(login.accessToken)
  } catch (error) {
    logAuthFlowError('auth-entry', 'profile-fetch-failed', toSafeErrorSummary(error))
    throw error
  }

  logAuthFlow('auth-entry', 'profile-fetch-ok', summarizeUserProfile(user))

  const session = createAuthSession(login, user)
  deps.saveSession(session)
  logAuthFlow('auth-entry', 'session-save-ok')

  if (login.isNewUser || user.nickname == null || user.nickname.trim() === '') {
    logAuthFlow('auth-entry', 'complete', { result: 'needsNickname' })
    return { mode: 'needsNickname', session, user }
  }

  logAuthFlow('auth-entry', 'complete', { result: 'ready' })
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
