const SEARCH_HISTORY_KEY = 'aniwhere-recent-searches'
const MAX_HISTORY = 5

export type RecentSearchKind = 'shop' | 'work'

export type RecentSearchEntry = {
  keyword: string
  kind?: RecentSearchKind
}

function normalizeRecentSearchEntry(item: unknown): RecentSearchEntry | null {
  if (typeof item === 'string') {
    const keyword = item.trim()

    return keyword ? { keyword } : null
  }

  if (item == null || typeof item !== 'object') {
    return null
  }

  const { keyword, kind } = item as { keyword?: unknown; kind?: unknown }
  if (typeof keyword !== 'string') {
    return null
  }

  const trimmed = keyword.trim()
  if (!trimmed) {
    return null
  }

  if (kind === 'shop' || kind === 'work') {
    return { keyword: trimmed, kind }
  }

  return { keyword: trimmed }
}

function recentSearchEntryKey(entry: RecentSearchEntry) {
  return `${entry.kind ?? 'keyword'}:${entry.keyword}`
}

function readStoredRecentSearchEntries() {
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

    return parsed
      .map(normalizeRecentSearchEntry)
      .filter((item): item is RecentSearchEntry => item != null)
      .slice(0, MAX_HISTORY)
  } catch {
    return []
  }
}

function writeRecentSearchEntries(entries: RecentSearchEntry[], fallback: RecentSearchEntry[]) {
  try {
    window.localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(entries))
  } catch {
    return fallback
  }

  return entries
}

export function readRecentSearches() {
  return readRecentSearchEntries().map((item) => item.keyword)
}

export function readRecentSearchEntries() {
  if (typeof window === 'undefined') {
    return []
  }

  return readStoredRecentSearchEntries()
}

export function pushRecentSearch(keyword: string) {
  return pushRecentSearchEntry(keyword).map((item) => item.keyword)
}

export function pushRecentSearchEntry(keyword: string, kind?: RecentSearchKind) {
  const trimmed = keyword.trim()
  if (!trimmed || typeof window === 'undefined') {
    return []
  }

  const nextEntry: RecentSearchEntry = kind ? { keyword: trimmed, kind } : { keyword: trimmed }
  const current = readRecentSearchEntries()
  const next = [nextEntry, ...current.filter((item) => recentSearchEntryKey(item) !== recentSearchEntryKey(nextEntry))]
    .slice(0, MAX_HISTORY)

  return writeRecentSearchEntries(next, next)
}

export function removeRecentSearch(keyword: string) {
  const trimmed = keyword.trim()
  const current = readRecentSearchEntries()
  if (!trimmed || typeof window === 'undefined') {
    return current.map((item) => item.keyword)
  }

  const next = current.filter((item) => item.keyword !== trimmed)

  return writeRecentSearchEntries(next, current).map((item) => item.keyword)
}

export function removeRecentSearchEntry(entry: RecentSearchEntry) {
  const current = readRecentSearchEntries()
  if (typeof window === 'undefined') {
    return current
  }

  const entryKey = recentSearchEntryKey(entry)
  const next = current.filter((item) => recentSearchEntryKey(item) !== entryKey)

  return writeRecentSearchEntries(next, current)
}

export function clearRecentSearches() {
  return clearRecentSearchEntries().map((item) => item.keyword)
}

export function clearRecentSearchEntries() {
  const current = readRecentSearchEntries()
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
