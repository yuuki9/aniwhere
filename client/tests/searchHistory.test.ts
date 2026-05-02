import test from 'node:test'
import assert from 'node:assert/strict'
import { pushRecentSearch, readRecentSearches } from '../src/shared/lib/searchHistory.ts'

test('search history keeps five recent terms and moves duplicates to the front', () => {
  const store = new Map<string, string>()
  const previousWindow = globalThis.window

  Object.defineProperty(globalThis, 'window', {
    configurable: true,
    value: {
      localStorage: {
        getItem: (key: string) => store.get(key) ?? null,
        setItem: (key: string, value: string) => {
          store.set(key, value)
        },
      },
    },
  })

  try {
    const keywords = ['히로아카', '귀칼', '주술회전', '하이큐', '프리렌', '미쿠', '귀칼']

    keywords.forEach((keyword) => {
      pushRecentSearch(keyword)
    })

    assert.deepEqual(readRecentSearches(), ['귀칼', '미쿠', '프리렌', '하이큐', '주술회전'])
  } finally {
    Object.defineProperty(globalThis, 'window', {
      configurable: true,
      value: previousWindow,
    })
  }
})
