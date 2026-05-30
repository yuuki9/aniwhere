import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import { fileURLToPath } from 'node:url'
import { createServer, type ViteDevServer } from 'vite'
import type { LoginResult, NicknameAvailabilityResult, UserSummary } from '../src/shared/api/types'
import type { EntryFlowResult } from '../src/shared/lib/auth'

let viteServer: ViteDevServer | undefined

const loadAuthEntryFlow = async () => {
  viteServer ??= await createServer({
    appType: 'custom',
    logLevel: 'error',
    mode: 'public',
    root: fileURLToPath(new URL('..', import.meta.url)),
    server: { middlewareMode: true },
  })

  return viteServer.ssrLoadModule('/src/shared/lib/authEntryFlow.ts') as Promise<{
    completeServiceEntry: (
      entry: EntryFlowResult,
      deps: {
        login: (payload: { authorizationCode: string; referrer: string }) => Promise<LoginResult>
        getProfile: (accessToken: string) => Promise<UserSummary>
        saveSession: (session: unknown) => void
      },
    ) => Promise<{ mode: 'ready' | 'needsNickname' }>
    saveAniwhereNickname: (
      nickname: string,
      accessToken: string,
      deps: {
        checkNicknameAvailability: (nickname: string, accessToken: string) => Promise<NicknameAvailabilityResult>
        updateMyNickname: (
          payload: { nickname: string; emojiIconFilename?: string | null },
          accessToken: string,
        ) => Promise<UserSummary>
        updateSessionUser: (user: UserSummary) => void
      },
    ) => Promise<UserSummary>
  }>
}

const source = (path: string) => fs.readFileSync(new URL(path, import.meta.url), 'utf8')

test.after(async () => {
  await viteServer?.close()
})

const loginResult: LoginResult = {
  accessToken: 'access-token',
  refreshToken: 'refresh-token',
  expiresIn: 900,
  role: 'ROLE_USER',
  isNewUser: false,
}

const userWithNickname: UserSummary = {
  id: 1,
  userKey: 443731104,
  nickname: '굿즈탐험가',
  emojiIconFilename: 'u1F47D.png',
  status: 'ACTIVE',
  role: 'ROLE_USER',
  lastLoginAt: null,
  createdAt: '2026-05-24T00:00:00',
}

test('completeServiceEntry passes Toss authorization code to the server and opens home for named users', async () => {
  const { completeServiceEntry } = await loadAuthEntryFlow()
  const calls: unknown[] = []

  const result = await completeServiceEntry(
    { mode: 'toss', authorizationCode: 'code-1', referrer: 'SANDBOX' },
    {
      login: async (payload) => {
        calls.push(payload)
        return loginResult
      },
      getProfile: async (accessToken) => {
        calls.push({ accessToken })
        return userWithNickname
      },
      saveSession: (session) => {
        calls.push({ session })
      },
    },
  )

  assert.equal(result.mode, 'ready')
  assert.deepEqual(calls[0], { authorizationCode: 'code-1', referrer: 'sandbox' })
  assert.deepEqual(calls[1], { accessToken: 'access-token' })
  assert.match(JSON.stringify(calls[2]), /refresh-token/)
})

test('completeServiceEntry asks for an Aniwhere nickname when the server marks a new or unnamed user', async () => {
  const { completeServiceEntry } = await loadAuthEntryFlow()

  const result = await completeServiceEntry(
    { mode: 'toss', authorizationCode: 'code-2', referrer: 'SANDBOX' },
    {
      login: async () => ({ ...loginResult, isNewUser: true }),
      getProfile: async () => ({ ...userWithNickname, nickname: null }),
      saveSession: () => undefined,
    },
  )

  assert.equal(result.mode, 'needsNickname')
})

test('saveAniwhereNickname trims, checks availability, updates the profile, and stores the user', async () => {
  const { saveAniwhereNickname } = await loadAuthEntryFlow()
  const calls: unknown[] = []

  const user = await saveAniwhereNickname('  굿즈탐험가  ', 'access-token', 'u1F680.png', {
    checkNicknameAvailability: async (nickname, accessToken) => {
      calls.push({ check: nickname, accessToken })
      return { nickname, available: true }
    },
    updateMyNickname: async (payload, accessToken) => {
      calls.push({ update: payload, accessToken })
      return { ...userWithNickname, nickname: payload.nickname }
    },
    updateSessionUser: (updatedUser) => {
      calls.push({ user: updatedUser.nickname })
    },
  })

  assert.equal(user.nickname, '굿즈탐험가')
  assert.deepEqual(calls[0], { check: '굿즈탐험가', accessToken: 'access-token' })
  assert.deepEqual(calls[1], {
    update: { nickname: '굿즈탐험가', emojiIconFilename: 'u1F680.png' },
    accessToken: 'access-token',
  })
  assert.deepEqual(calls[2], { user: '굿즈탐험가' })
})

test('saveAniwhereNickname rejects unavailable nicknames before updating the profile', async () => {
  const { saveAniwhereNickname } = await loadAuthEntryFlow()
  let updateCalled = false

  await assert.rejects(
    saveAniwhereNickname('이미있는닉네임', 'access-token', undefined, {
      checkNicknameAvailability: async (nickname) => ({ nickname, available: false }),
      updateMyNickname: async () => {
        updateCalled = true
        return userWithNickname
      },
      updateSessionUser: () => undefined,
    }),
    /이미 사용 중인 닉네임/,
  )

  assert.equal(updateCalled, false)
})

test('auth flow logs safe error summaries instead of raw error objects', () => {
  const auth = source('../src/shared/lib/auth.ts')
  const authEntryFlow = source('../src/shared/lib/authEntryFlow.ts')
  const rawAppLoginErrorLogPattern = /console\.error\(\s*'\[aniwhere:auth\] appLogin failed'\s*,\s*error\s*\)/
  const rawAuthEntryErrorLogPattern =
    /console\.error\(\s*'\[aniwhere:auth-entry\][^']*'\s*,\s*\{\s*error\s*\}\s*\)/s

  assert.match(auth, /toSafeErrorSummary\(error\)/)
  assert.match(authEntryFlow, /error: toSafeErrorSummary\(error\)/)
  assert.doesNotMatch(auth, /auth-debug|console\.info/)
  assert.doesNotMatch(authEntryFlow, /auth-debug|console\.info/)
  assert.match("console.error('[aniwhere:auth-entry] server login failed', { error })", rawAuthEntryErrorLogPattern)
  assert.doesNotMatch(auth, rawAppLoginErrorLogPattern)
  assert.doesNotMatch(authEntryFlow, rawAuthEntryErrorLogPattern)
})

test('startServiceEntry does not bypass Toss login with a preview session', () => {
  const auth = source('../src/shared/lib/auth.ts')

  assert.doesNotMatch(auth, /mode:\s*'preview'/)
  assert.doesNotMatch(auth, /return\s+\{\s*mode:\s*'preview'\s*\}/)
  assert.match(auth, /appLogin\(\)/)
})

test('auth session storage failures are contained', () => {
  const authSession = source('../src/shared/lib/authSession.ts')

  assert.match(authSession, /try\s*\{\s*window\.localStorage\.setItem/s)
  assert.match(authSession, /try\s*\{\s*window\.localStorage\.removeItem/s)
  assert.match(authSession, /toSafeErrorSummary\(error\)/)
})
