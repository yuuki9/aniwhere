import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import {
  buildTrendExploreHref,
  formatTrendKindLabel,
  type TrendRankingItem,
} from './trendRankingViewModel'

type TrendRankingPanelProps = {
  action?: ReactNode
  items: TrendRankingItem[]
  returnTo?: string
  title?: string
}

const TREND_RANK_COLUMN_SIZE = 5
const TREND_RANK_LIMIT = 10

function TrendRankRow({ item, returnTo }: { item: TrendRankingItem; returnTo?: string }) {
  return (
    <Link className="home-trend-rank-row" to={buildTrendExploreHref(item, returnTo ? { returnTo } : {})}>
      <span className="home-trend-rank-number">{item.rank}</span>
      <span className="home-trend-rank-label">{item.label}</span>
      <span className="home-trend-rank-kind">{formatTrendKindLabel(item.kind)}</span>
    </Link>
  )
}

export function TrendRankingPanel({
  action,
  items,
  returnTo,
  title = '인기 검색어',
}: TrendRankingPanelProps) {
  const visibleItems = items.slice(0, TREND_RANK_LIMIT)
  const columns = [
    visibleItems.slice(0, TREND_RANK_COLUMN_SIZE),
    visibleItems.slice(TREND_RANK_COLUMN_SIZE, TREND_RANK_LIMIT),
  ].filter((column) => column.length > 0)

  if (visibleItems.length === 0) {
    return null
  }

  return (
    <div className="home-trend-rank-panel">
      <div className="home-trend-rank-head">
        <span>{title}</span>
        {action}
      </div>
      <div className="home-trend-rank-list">
        {columns.map((column, columnIndex) => (
          <div className="home-trend-rank-column" key={`trend-rank-column-${columnIndex}`}>
            {column.map((item) => (
              <TrendRankRow key={`rank-${item.kind}-${item.shopId ?? item.workId ?? item.label}-${item.rank}`} item={item} returnTo={returnTo} />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
