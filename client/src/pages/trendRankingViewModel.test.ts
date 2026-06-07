import {
  buildTrendExploreHref,
  buildTrendPreviewItems,
  formatTrendActivity,
  formatTrendActivityAria,
  formatTrendKindLabel,
  normalizeKeywordRankingItem,
  normalizeMixedEntityRankingItem,
  normalizeShopRankingItem,
  type TrendRankingItem,
} from './trendRankingViewModel.ts'

const mixedItem = normalizeMixedEntityRankingItem({
  rank: 1,
  kind: 'WORK',
  shopId: null,
  workId: 7,
  label: '장송의 프리렌',
  score: 9,
  eventCount: 3,
})

const keywordItem = normalizeKeywordRankingItem({
  rank: 2,
  keyword: '굿즈',
  score: 4,
  eventCount: 0,
})

const sourceItems: TrendRankingItem[] = [
  mixedItem,
  keywordItem,
  { ...mixedItem, rank: 3, label: '귀멸의 칼날' },
  { ...mixedItem, rank: 4, label: '블루 아카이브' },
  { ...mixedItem, rank: 5, label: '하이큐!!' },
  { ...mixedItem, rank: 6, label: '원신' },
]

const shopItem = normalizeShopRankingItem({
  rank: 3,
  shopId: 11,
  label: 'Ani Shop',
  score: 5,
  eventCount: 2,
})

if (buildTrendPreviewItems(sourceItems).length !== 5) {
  throw new Error('trend preview must expose Top5 only')
}

if (formatTrendKindLabel(mixedItem.kind) !== '작품') {
  throw new Error('work kind label mismatch')
}

if (formatTrendKindLabel(keywordItem.kind) !== '검색어') {
  throw new Error('keyword kind label mismatch')
}

if (formatTrendActivity(mixedItem) !== '3회') {
  throw new Error('event activity label mismatch')
}

if (formatTrendActivityAria(mixedItem) !== '집계 이벤트 3회') {
  throw new Error('event activity aria label mismatch')
}

if (formatTrendActivity(keywordItem) !== null) {
  throw new Error('cold-start activity label must be hidden')
}

if (formatTrendActivityAria(keywordItem) !== null) {
  throw new Error('cold-start activity aria label must be hidden')
}

if (
  buildTrendExploreHref(mixedItem) !==
  '/explore?view=list&rankingEntry=trend&scope=work&keyword=%EC%9E%A5%EC%86%A1%EC%9D%98+%ED%94%84%EB%A6%AC%EB%A0%8C'
) {
  throw new Error('work trend row must navigate to work keyword explore results')
}

if (buildTrendExploreHref(mixedItem).includes('workId=')) {
  throw new Error('work trend row must not write workId as a shop facet filter')
}

if (buildTrendExploreHref(keywordItem) !== '/explore?view=list&rankingEntry=trend&keyword=%EA%B5%BF%EC%A6%88') {
  throw new Error('keyword trend row must navigate to keyword explore results')
}

if (buildTrendExploreHref(shopItem) !== '/explore?view=list&rankingEntry=trend&scope=shop&keyword=Ani+Shop') {
  throw new Error('shop trend row must navigate to shop keyword explore results')
}

if (/[?&](shopId|sheet)=/.test(buildTrendExploreHref(shopItem))) {
  throw new Error('shop trend row must not open a detail sheet or write facet state')
}
