import { useState, type ReactNode } from 'react'
import type { Shop } from '../../shared/api/types'
import { formatRelativeUpdated, statusToLabel } from '../../shared/lib/format'
import { MapDetailIcon, type MapDetailIconName } from '../../shared/ui/mapDetailIcons'

type MapDetailInfoCardProps = {
  shop: Shop
  description?: string | null
  floorLabel: string | null
  workTypeLabels: string[]
  distanceLabel?: string | null
  onOpenDirections: (event?: { stopPropagation: () => void }) => void
}

function MapDetailRow({
  className,
  icon,
  label,
  description,
}: {
  className?: string
  icon: MapDetailIconName
  label: string
  description: ReactNode
}) {
  return (
    <li
      className={['map-sheet-detail-row-v3', 'map-sheet-detail-row-v3--has-icon', className]
        .filter(Boolean)
        .join(' ')}
    >
      <span className="map-sheet-detail-icon">
        <MapDetailIcon name={icon} />
      </span>
      <div className="map-sheet-detail-copy">
        <span>{label}</span>
        <strong>{description}</strong>
      </div>
    </li>
  )
}

export function MapDetailInfoCard({
  shop,
  description,
  floorLabel,
  workTypeLabels,
  onOpenDirections,
}: MapDetailInfoCardProps) {
  const [isAiSummaryExpanded, setIsAiSummaryExpanded] = useState(false)
  const updatedLabel = formatRelativeUpdated(shop.updatedAt)
  const aiSummary = description?.replace(/\s+/g, ' ').trim() ?? null
  const normalizedVisitTip = shop.visitTip?.replace(/\s+/g, ' ').trim() ?? null
  const shouldShowVisitTip = normalizedVisitTip != null && normalizedVisitTip !== aiSummary
  const aiSummaryPreviewLimit = 72
  const shouldCollapseAiSummary = aiSummary ? aiSummary.length > aiSummaryPreviewLimit : false
  const visibleAiSummary =
    aiSummary && shouldCollapseAiSummary && !isAiSummaryExpanded
      ? `${aiSummary.slice(0, aiSummaryPreviewLimit).trimEnd()}…`
      : aiSummary
  const addressFloorLabel = floorLabel

  return (
    <section className="section map-sheet-info-card" id="map-place-info">
      {visibleAiSummary ? (
        <div
          className={[
            'map-sheet-ai-summary',
            'map-sheet-ai-summary-priority',
            isAiSummaryExpanded ? 'map-sheet-ai-summary-expanded' : null,
          ]
            .filter(Boolean)
            .join(' ')}
        >
          <div className="map-sheet-ai-summary-head">
            <svg aria-hidden="true" viewBox="0 0 24 24">
              <path d="M12 3.75 13.65 8.1 18 9.75l-4.35 1.65L12 15.75l-1.65-4.35L6 9.75l4.35-1.65L12 3.75Z" />
              <path d="M18.25 14.25 19 16.1l1.75.65L19 17.4l-.75 1.85-.75-1.85-1.75-.65 1.75-.65.75-1.85Z" />
              <path d="M5.75 15.25 6.4 16.8l1.6.6-1.6.6-.65 1.55L5.1 18 3.5 17.4l1.6-.6.65-1.55Z" />
            </svg>
            <strong>AI가 요약한 정보</strong>
          </div>
          <p>{visibleAiSummary}</p>
          {shouldCollapseAiSummary ? (
            <button
              className="map-sheet-ai-summary-more"
              type="button"
              aria-expanded={isAiSummaryExpanded}
              onClick={() => setIsAiSummaryExpanded((current) => !current)}
            >
              {isAiSummaryExpanded ? '접기' : '더보기'}
            </button>
          ) : null}
        </div>
      ) : null}

      <ul className="map-sheet-info-list-v2 map-sheet-info-list-v3">
        <MapDetailRow
          className="map-sheet-detail-row-address"
          icon="pin"
          label="주소"
          description={
            <span className="map-sheet-address-inline">
              <button
                className="map-sheet-address-link"
                type="button"
                aria-label={`${shop.address} 길찾기`}
                onClick={onOpenDirections}
              >
                {shop.address}
              </button>
              {addressFloorLabel ? <span className="map-sheet-address-meta">{addressFloorLabel}</span> : null}
            </span>
          }
        />

        <MapDetailRow icon="clock" label="영업 상태" description={statusToLabel(shop.status)} />

        <MapDetailRow
          icon="tag"
          label="카테고리"
          description={
            shop.categories.length > 0
              ? shop.categories.slice(0, 6).map((category) => category.name).join(' · ')
              : '등록된 카테고리가 없어요'
          }
        />

        <MapDetailRow
          icon="collection"
          label="작품유형"
          description={
            workTypeLabels.length > 0
              ? workTypeLabels.join(' · ')
              : '연결된 작품유형 정보가 없어요'
          }
        />

        {shouldShowVisitTip ? <MapDetailRow icon="sparkle" label="방문 팁" description={shop.visitTip} /> : null}

        <MapDetailRow icon="calendar" label="최근 업데이트" description={updatedLabel} />
      </ul>
    </section>
  )
}
