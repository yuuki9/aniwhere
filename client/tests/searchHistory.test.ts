import test from 'node:test'
import assert from 'node:assert/strict'
import {
  clearRecentSearches,
  pushRecentSearch,
  pushRecentSearchEntry,
  readRecentSearches,
  readRecentSearchEntries,
  removeRecentSearch,
  removeRecentSearchEntry,
} from '../src/shared/lib/searchHistory.ts'

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

test('search history removes one term and clears all terms', () => {
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
        removeItem: (key: string) => {
          store.delete(key)
        },
      },
    },
  })

  try {
    pushRecentSearch('피규어')
    pushRecentSearch('굿즈')
    pushRecentSearch('카페')

    assert.deepEqual(removeRecentSearch('굿즈'), ['카페', '피규어'])
    assert.deepEqual(readRecentSearches(), ['카페', '피규어'])
    assert.deepEqual(clearRecentSearches(), [])
    assert.deepEqual(readRecentSearches(), [])
  } finally {
    Object.defineProperty(globalThis, 'window', {
      configurable: true,
      value: previousWindow,
    })
  }
})

test('search history preserves current list when storage writes fail', () => {
  const store = new Map<string, string>()
  const previousWindow = globalThis.window

  Object.defineProperty(globalThis, 'window', {
    configurable: true,
    value: {
      localStorage: {
        getItem: (key: string) => store.get(key) ?? null,
        setItem: () => {
          throw new Error('storage unavailable')
        },
        removeItem: () => {
          throw new Error('storage unavailable')
        },
      },
    },
  })

  try {
    store.set('aniwhere-recent-searches', JSON.stringify(['카페', '굿즈', '피규어']))

    assert.deepEqual(removeRecentSearch('굿즈'), ['카페', '굿즈', '피규어'])
    assert.deepEqual(clearRecentSearches(), ['카페', '굿즈', '피규어'])
  } finally {
    Object.defineProperty(globalThis, 'window', {
      configurable: true,
      value: previousWindow,
    })
  }
})

test('search history stores autocomplete result kinds while reading legacy keyword strings', () => {
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
    store.set('aniwhere-recent-searches', JSON.stringify(['legacy keyword']))

    assert.deepEqual(readRecentSearchEntries(), [{ keyword: 'legacy keyword' }])
    assert.deepEqual(pushRecentSearchEntry('No Game No Life', 'work'), [
      { keyword: 'No Game No Life', kind: 'work' },
      { keyword: 'legacy keyword' },
    ])
    assert.deepEqual(pushRecentSearchEntry('Animate Hongdae', 'shop'), [
      { keyword: 'Animate Hongdae', kind: 'shop' },
      { keyword: 'No Game No Life', kind: 'work' },
      { keyword: 'legacy keyword' },
    ])
    assert.deepEqual(removeRecentSearchEntry({ keyword: 'No Game No Life', kind: 'work' }), [
      { keyword: 'Animate Hongdae', kind: 'shop' },
      { keyword: 'legacy keyword' },
    ])
    assert.deepEqual(readRecentSearches(), ['Animate Hongdae', 'legacy keyword'])
  } finally {
    Object.defineProperty(globalThis, 'window', {
      configurable: true,
      value: previousWindow,
    })
  }
})
