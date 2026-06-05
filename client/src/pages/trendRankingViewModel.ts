import type {
  KeywordRankingItem,
  MixedEntityRankingItem,
  PopularityRankingKind,
  ShopRankingItem,
  WorkRankingItem,
} from '../shared/api/types'

export type TrendRankingItem = {
  rank: number
  kind: PopularityRankingKind
  label: string
  shopId: number | null
  workId: number | null
  score: number
  eventCount: number
}

const EXPLORE_LIST_ENTRY_PARAM = 'entry'
const EXPLORE_INITIAL_LIST_ENTRY_VALUE = 'list'

export function normalizeMixedEntityRankingItem(item: MixedEntityRankingItem): TrendRankingItem {
  return {
    rank: item.rank,
    kind: item.kind,
    label: item.label,
    shopId: item.shopId,
    workId: item.workId,
    score: item.score,
    eventCount: item.eventCount,
  }
}

export function normalizeWorkRankingItem(item: WorkRankingItem): TrendRankingItem {
  return {
    rank: item.rank,
    kind: 'WORK',
    label: item.label,
    shopId: null,
    workId: item.workId,
    score: item.score,
    eventCount: item.eventCount,
  }
}

export function normalizeShopRankingItem(item: ShopRankingItem): TrendRankingItem {
  return {
    rank: item.rank,
    kind: 'SHOP',
    label: item.label,
    shopId: item.shopId,
    workId: null,
    score: item.score,
    eventCount: item.eventCount,
  }
}

export function normalizeKeywordRankingItem(item: KeywordRankingItem): TrendRankingItem {
  return {
    rank: item.rank,
    kind: 'KEYWORD',
    label: item.keyword,
    shopId: null,
    workId: null,
    score: item.score,
    eventCount: item.eventCount,
  }
}

export function formatTrendKindLabel(kind: PopularityRankingKind) {
  switch (kind) {
    case 'WORK':
      return '작품'
    case 'SHOP':
      return '매장'
    case 'KEYWORD':
      return '검색어'
  }
}

export function formatTrendActivity(item: TrendRankingItem) {
  return item.eventCount > 0 ? `${item.eventCount}회` : null
}

export function formatTrendActivityAria(item: TrendRankingItem) {
  return item.eventCount > 0 ? `집계 이벤트 ${item.eventCount}회` : null
}

type BuildTrendExploreHrefOptions = {
  returnTo?: string
}

export function buildTrendExploreHref(item: TrendRankingItem, options: BuildTrendExploreHrefOptions = {}) {
  const params = new URLSearchParams()
  params.set('view', 'list')

  if (item.kind === 'WORK') {
    params.set('scope', 'work')
    if (item.workId != null) {
      params.set('workId', String(item.workId))
    }
  }

  params.set('keyword', item.label)

  if (options.returnTo) {
    params.set(EXPLORE_LIST_ENTRY_PARAM, EXPLORE_INITIAL_LIST_ENTRY_VALUE)
    params.set('returnTo', options.returnTo)
  }

  return `/explore?${params.toString()}`
}

export const buildTrendPreviewItems = (items: TrendRankingItem[], limit = 5) => items.slice(0, limit)
