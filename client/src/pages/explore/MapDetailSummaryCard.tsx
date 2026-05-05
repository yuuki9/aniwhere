import { Link } from 'react-router-dom'
import type { Shop } from '../../shared/api/types'
import { MapDetailIcon } from '../../shared/ui/mapDetailIcons'
import { StatusPill } from '../../shared/ui/StatusPill'

type MapDetailSummaryCardProps = {
  shop: Shop
  primaryLinkUrl: string | null
  actionLinkUrl: string | null
  descriptionPreview: string | null
  shareFeedback: string | null
  onShareShop: () => void
  onOpenDirections: (event?: { stopPropagation: () => void }) => void
}

export function MapDetailSummaryCard({
  shop,
  primaryLinkUrl,
  actionLinkUrl,
  descriptionPreview,
  shareFeedback,
  onShareShop,
  onOpenDirections,
}: MapDetailSummaryCardProps) {
  return (
    <section className="section map-sheet-summary-card map-sheet-summary-card-compact" id="map-place-home">
      <div className="map-sheet-summary-head map-sheet-summary-head-compact">
        <div className="map-sheet-summary-copy">
          <span className="eyebrow">{shop.regionName ?? `지역 ${shop.regionId ?? '-'}`}</span>
          <h1>{shop.name}</h1>
          <p>
            {shop.categories.length > 0
              ? shop.categories.join(' · ')
              : shop.works.length > 0
                ? shop.works.slice(0, 2).join(' · ')
                : '카테고리 확인 중'}
          </p>
        </div>
        <StatusPill status={shop.status} />
      </div>

      <div className="map-sheet-primary-actions">
        {primaryLinkUrl ? (
          <a
            className="map-sheet-primary-button map-sheet-primary-button-fill"
            href={primaryLinkUrl}
            rel="noreferrer"
            target="_blank"
          >
            <MapDetailIcon name="link" />
            <span>공식 링크</span>
          </a>
        ) : null}
        <Link className="map-sheet-primary-button" to="/community">
          <MapDetailIcon name="tag" />
          <span>후기 보기</span>
        </Link>
      </div>

      <div className="map-place-action-grid" aria-label="매장 주요 액션">
        {actionLinkUrl ? (
          <a className="map-place-action" href={actionLinkUrl} rel="noreferrer" target="_blank">
            <MapDetailIcon name="link" />
            <span>전화/링크</span>
          </a>
        ) : (
          <button className="map-place-action" type="button" disabled aria-disabled="true">
            <MapDetailIcon name="link" />
            <span>전화/링크</span>
          </button>
        )}
        <button className="map-place-action" type="button" onClick={onShareShop}>
          <MapDetailIcon name="tag" />
          <span>공유</span>
        </button>
        <button className="map-place-action map-place-action-primary" type="button" onClick={onOpenDirections}>
          <MapDetailIcon name="pin" />
          <span>경로 확인</span>
        </button>
        <Link className="map-place-action" to={`/community?shopId=${shop.id}`}>
          <MapDetailIcon name="clock" />
          <span>리뷰</span>
        </Link>
      </div>
      {shareFeedback ? (
        <p className="map-place-feedback" role="status" aria-live="polite">
          {shareFeedback}
        </p>
      ) : null}

      <nav className="map-place-tabs" aria-label="상세 정보 바로가기">
        <a href="#map-place-home">홈</a>
        <a href="#map-place-review">리뷰</a>
        <a href="#map-place-detail">지도</a>
        <a href="#map-place-info">정보</a>
      </nav>

      {descriptionPreview ? (
        <div className="map-sheet-ai-summary">
          <div className="map-sheet-ai-summary-head">
            <strong>AI 요약 정보</strong>
            <span>수집 링크 기반</span>
          </div>
          <p>{descriptionPreview}</p>
        </div>
      ) : null}
    </section>
  )
}
