import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import { fileURLToPath } from 'node:url'
import { createServer, type ViteDevServer } from 'vite'
import type { LoginResult, NicknameAvailabilityResult, RefreshResult, UserSummary } from '../src/shared/api/types'
import type { EntryFlowResult } from '../src/shared/lib/auth'
import type { AuthSession } from '../src/shared/lib/authSession'

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
    resumeStoredServiceEntry: (deps: {
      now: () => number
      readSession: () => AuthSession | null
      refresh: (payload: { refreshToken: string }) => Promise<RefreshResult>
      getProfile: (accessToken: string) => Promise<UserSummary>
      saveSession: (session: AuthSession) => void
      clearSession: () => void
    }) => Promise<{ mode: 'ready' | 'needsNickname'; session: AuthSession; user: UserSummary } | null>
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

const storedSession: AuthSession = {
  accessToken: 'stored-access-token',
  refreshToken: 'stored-refresh-token',
  accessTokenExpiresAt: 1_900_000_000,
  role: 'ROLE_USER',
  user: userWithNickname,
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

test('resumeStoredServiceEntry opens home from a fresh named local session without refreshing', async () => {
  const { resumeStoredServiceEntry } = await loadAuthEntryFlow()
  let refreshCalled = false
  let profileCalled = false

  const result = await resumeStoredServiceEntry({
    now: () => 1_800_000_000_000,
    readSession: () => storedSession,
    refresh: async () => {
      refreshCalled = true
      return { accessToken: 'new-access', refreshToken: 'new-refresh', expiresIn: 1_900_000_000 }
    },
    getProfile: async () => {
      profileCalled = true
      return userWithNickname
    },
    saveSession: () => undefined,
    clearSession: () => undefined,
  })

  assert.equal(result?.mode, 'ready')
  assert.equal(result?.session.accessToken, 'stored-access-token')
  assert.equal(refreshCalled, false)
  assert.equal(profileCalled, false)
})

test('resumeStoredServiceEntry refreshes an expired access token and stores the refreshed profile', async () => {
  const { resumeStoredServiceEntry } = await loadAuthEntryFlow()
  const calls: unknown[] = []

  const result = await resumeStoredServiceEntry({
    now: () => 1_900_000_000_000,
    readSession: () => ({ ...storedSession, accessTokenExpiresAt: 1_800_000_000 }),
    refresh: async (payload) => {
      calls.push({ refresh: payload })
      return { accessToken: 'refreshed-access', refreshToken: 'refreshed-refresh', expiresIn: 1_900_000_900 }
    },
    getProfile: async (accessToken) => {
      calls.push({ profile: accessToken })
      return { ...userWithNickname, role: 'ROLE_ADMIN' }
    },
    saveSession: (session) => {
      calls.push({ session })
    },
    clearSession: () => {
      calls.push({ clear: true })
    },
  })

  assert.equal(result?.mode, 'ready')
  assert.deepEqual(calls[0], { refresh: { refreshToken: 'stored-refresh-token' } })
  assert.match(JSON.stringify(calls[1]), /refreshed-refresh/)
  assert.deepEqual(calls[2], { profile: 'refreshed-access' })
  assert.match(JSON.stringify(calls[3]), /refreshed-refresh/)
  assert.match(JSON.stringify(calls[3]), /ROLE_ADMIN/)
  assert.equal(calls.length, 4)
})

test('resumeStoredServiceEntry keeps a fresh stored session when profile sync fails', async () => {
  const { resumeStoredServiceEntry } = await loadAuthEntryFlow()
  const unnamedSession = { ...storedSession, user: { ...userWithNickname, nickname: null } }
  let refreshCalled = false
  let cleared = false

  const result = await resumeStoredServiceEntry({
    now: () => 1_800_000_000_000,
    readSession: () => unnamedSession,
    refresh: async () => {
      refreshCalled = true
      return { accessToken: 'new-access', refreshToken: 'new-refresh', expiresIn: 1_900_000_000 }
    },
    getProfile: async () => {
      throw new Error('Temporary profile failure')
    },
    saveSession: () => undefined,
    clearSession: () => {
      cleared = true
    },
  })

  assert.equal(result?.mode, 'needsNickname')
  assert.equal(result?.session.accessToken, 'stored-access-token')
  assert.equal(refreshCalled, false)
  assert.equal(cleared, false)
})

test('resumeStoredServiceEntry keeps a refreshed session when profile sync fails after refresh', async () => {
  const { resumeStoredServiceEntry } = await loadAuthEntryFlow()
  const calls: unknown[] = []

  const result = await resumeStoredServiceEntry({
    now: () => 1_900_000_000_000,
    readSession: () => ({ ...storedSession, accessTokenExpiresAt: 1_800_000_000 }),
    refresh: async () => {
      calls.push({ refresh: true })
      return { accessToken: 'refreshed-access', refreshToken: 'refreshed-refresh', expiresIn: 1_900_000_900 }
    },
    getProfile: async () => {
      calls.push({ profile: true })
      throw new Error('Temporary profile failure')
    },
    saveSession: (session) => {
      calls.push({ session })
    },
    clearSession: () => {
      calls.push({ clear: true })
    },
  })

  assert.equal(result?.mode, 'ready')
  assert.equal(result?.session.accessToken, 'refreshed-access')
  assert.deepEqual(calls[0], { refresh: true })
  assert.match(JSON.stringify(calls[1]), /refreshed-refresh/)
  assert.deepEqual(calls[2], { profile: true })
  assert.equal(calls.length, 3)
})

test('resumeStoredServiceEntry clears storage and falls back to Toss login when refresh fails', async () => {
  const { resumeStoredServiceEntry } = await loadAuthEntryFlow()
  let cleared = false

  const result = await resumeStoredServiceEntry({
    now: () => 1_900_000_000_000,
    readSession: () => ({ ...storedSession, accessTokenExpiresAt: 1_800_000_000 }),
    refresh: async () => {
      throw new Error('Invalid refresh token')
    },
    getProfile: async () => userWithNickname,
    saveSession: () => undefined,
    clearSession: () => {
      cleared = true
    },
  })

  assert.equal(result, null)
  assert.equal(cleared, true)
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
  assert.match(authSession, /function normalizeToken/)
  assert.match(authSession, /function removeHeaderUnsafeCharacters\(value: string\)/)
  assert.match(authSession, /code > 31 && \(code < 127 \|\| code > 159\) && code !== 0x2028 && code !== 0x2029/)
  assert.match(authSession, /withoutBearer = trimmed\.replace\(\/\^Bearer\[\\s\\u00A0\]\+\/i, ''\)/)
  assert.match(authSession, /removeHeaderUnsafeCharacters\(withoutWrappingQuotes\)/)
  assert.match(authSession, /replace\(\/\[\\s\\u00A0\]\+\/g, ''\)/)
  assert.match(authSession, /return normalizeToken\(readAuthSession\(\)\?\.accessToken\) \?\? null/)
})

test('api authorization headers strip hidden WebView control characters before fetch', () => {
  const apiClient = source('../src/shared/api/client.ts')

  assert.match(apiClient, /function toAuthorizationHeaderValue/)
  assert.match(apiClient, /function removeHeaderUnsafeCharacters\(value: string\)/)
  assert.match(apiClient, /code > 31 && \(code < 127 \|\| code > 159\) && code !== 0x2028 && code !== 0x2029/)
  assert.match(apiClient, /withoutBearer = trimmed\.replace\(\/\^Bearer\[\\s\\u00A0\]\+\/i, ''\)/)
  assert.match(apiClient, /removeHeaderUnsafeCharacters\(headerSafeToken\)/)
  assert.match(apiClient, /replace\(\/\[\\s\\u00A0\]\+\/g, ''\)/)
  assert.match(apiClient, /headers\.set\('Authorization', authorization\)/)
})
