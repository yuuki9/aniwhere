import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import {
  getKeywordRankings,
  getMixedEntityRankings,
  getShopRankings,
  getWorkRankings,
} from '../shared/api/rankings'
import type { RankingResponse } from '../shared/api/types'
import {
  buildTrendExploreHref,
  formatTrendActivity,
  formatTrendActivityAria,
  formatTrendKindLabel,
  normalizeKeywordRankingItem,
  normalizeMixedEntityRankingItem,
  normalizeShopRankingItem,
  normalizeWorkRankingItem,
  type TrendRankingItem,
} from './trendRankingViewModel'

type TrendTab = 'entities' | 'works' | 'shops' | 'keywords'

type TrendTabConfig = {
  id: TrendTab
  label: string
  queryKey: string
  queryFn: () => Promise<RankingResponse<unknown>>
  normalize: (item: unknown) => TrendRankingItem
}

const TREND_TABS: TrendTabConfig[] = [
  {
    id: 'entities',
    label: '전체',
    queryKey: 'search-entities',
    queryFn: () => getMixedEntityRankings({ window: '7d', limit: 20 }) as Promise<RankingResponse<unknown>>,
    normalize: (item) => normalizeMixedEntityRankingItem(item as Parameters<typeof normalizeMixedEntityRankingItem>[0]),
  },
  {
    id: 'works',
    label: '작품',
    queryKey: 'works',
    queryFn: () => getWorkRankings({ window: '7d', limit: 20 }) as Promise<RankingResponse<unknown>>,
    normalize: (item) => normalizeWorkRankingItem(item as Parameters<typeof normalizeWorkRankingItem>[0]),
  },
  {
    id: 'shops',
    label: '매장',
    queryKey: 'shops',
    queryFn: () => getShopRankings({ window: '7d', limit: 20 }) as Promise<RankingResponse<unknown>>,
    normalize: (item) => normalizeShopRankingItem(item as Parameters<typeof normalizeShopRankingItem>[0]),
  },
  {
    id: 'keywords',
    label: '검색어',
    queryKey: 'search-keywords',
    queryFn: () => getKeywordRankings({ window: '7d', limit: 20 }) as Promise<RankingResponse<unknown>>,
    normalize: (item) => normalizeKeywordRankingItem(item as Parameters<typeof normalizeKeywordRankingItem>[0]),
  },
]

function TrendDetailRow({ item }: { item: TrendRankingItem }) {
  const activityLabel = formatTrendActivity(item)
  const activityAriaLabel = formatTrendActivityAria(item)

  return (
    <Link
      aria-label={`${item.label} 관련 매장 검색 결과 보기`}
      className="trends-list-row"
      to={buildTrendExploreHref(item, { returnTo: '/trends' })}
    >
      <span className="trends-list-rank" aria-hidden="true">
        {item.rank}
      </span>
      <span className="trends-list-main">
        <strong>{item.label}</strong>
        <span className="trend-ranking-summary">
          <span>{formatTrendKindLabel(item.kind)}</span>
        </span>
      </span>
      {activityLabel != null ? (
        <span className="trend-ranking-metric" aria-label={activityAriaLabel ?? undefined}>
          <span className="trend-ranking-metric-value" key={`${item.rank}-${item.eventCount}-${item.score}`}>
            {activityLabel}
          </span>
        </span>
      ) : null}
    </Link>
  )
}

export function TrendsPage() {
  const [activeTab, setActiveTab] = useState<TrendTab>('entities')
  const activeTabConfig = TREND_TABS.find((tab) => tab.id === activeTab) ?? TREND_TABS[0]
  const rankingQuery = useQuery({
    queryKey: ['rankings', activeTabConfig.queryKey, '7d', 20],
    queryFn: activeTabConfig.queryFn,
    staleTime: 30_000,
    refetchOnMount: 'always',
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
  })
  const items = useMemo(
    () => (rankingQuery.data?.items ?? []).map(activeTabConfig.normalize),
    [activeTabConfig, rankingQuery.data?.items],
  )

  return (
    <main className="app-shell trends-shell">
      <section className="trends-head" aria-labelledby="trends-title">
        <h1 id="trends-title">지금 뜨는 검색</h1>
      </section>

      <nav className="trends-tab-list" aria-label="트렌드 랭킹 보기">
        {TREND_TABS.map((tab) => (
          <button
            aria-pressed={tab.id === activeTab}
            className={tab.id === activeTab ? 'trends-tab trends-tab-active' : 'trends-tab'}
            type="button"
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {rankingQuery.isLoading ? (
        <section className="home-pending-card" aria-label="트렌드 랭킹 로딩">
          <strong>랭킹을 불러오는 중이에요.</strong>
        </section>
      ) : null}
      {rankingQuery.isError ? (
        <section className="home-pending-card" aria-label="트렌드 랭킹 오류">
          <strong>랭킹을 불러오지 못했어요.</strong>
        </section>
      ) : null}
      {!rankingQuery.isLoading && !rankingQuery.isError && items.length === 0 ? (
        <section className="home-pending-card" aria-label="빈 트렌드 랭킹">
          <strong>아직 충분한 검색 데이터가 없어요.</strong>
        </section>
      ) : null}
      {!rankingQuery.isLoading && !rankingQuery.isError && items.length > 0 ? (
        <section className="trends-list-card" aria-label="지금 뜨는 검색 Top20">
          {items.map((item) => (
            <TrendDetailRow key={`${item.kind}-${item.shopId ?? item.workId ?? item.label}-${item.rank}`} item={item} />
          ))}
        </section>
      ) : null}
    </main>
  )
}
