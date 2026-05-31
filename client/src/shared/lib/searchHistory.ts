const SEARCH_HISTORY_KEY = 'aniwhere-recent-searches'
const MAX_HISTORY = 5

export function readRecentSearches() {
  if (typeof window === 'undefined') {
    return []
  }

  try {
    const raw = window.localStorage.getItem(SEARCH_HISTORY_KEY)
    if (!raw) {
      return []
    }

    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) {
      return []
    }

    return parsed.filter((item): item is string => typeof item === 'string').slice(0, MAX_HISTORY)
  } catch {
    return []
  }
}

export function pushRecentSearch(keyword: string) {
  const trimmed = keyword.trim()
  if (!trimmed || typeof window === 'undefined') {
    return []
  }

  const next = [trimmed, ...readRecentSearches().filter((item) => item !== trimmed)].slice(0, MAX_HISTORY)

  try {
    window.localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(next))
  } catch {
    return next
  }

  return next
}

export function removeRecentSearch(keyword: string) {
  const trimmed = keyword.trim()
  const current = readRecentSearches()
  if (!trimmed || typeof window === 'undefined') {
    return current
  }

  const next = current.filter((item) => item !== trimmed)

  try {
    window.localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(next))
  } catch {
    return current
  }

  return next
}

export function clearRecentSearches() {
  const current = readRecentSearches()
  if (typeof window === 'undefined') {
    return current
  }

  try {
    window.localStorage.removeItem(SEARCH_HISTORY_KEY)
  } catch {
    return current
  }

  return []
}
