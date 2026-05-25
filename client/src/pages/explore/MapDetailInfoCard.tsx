import { useState, type ReactNode } from 'react'
import { Button, ListRow } from '@aniwhere/tds-mobile'
import type { Shop } from '../../shared/api/types'
import { formatRelativeUpdated, statusToLabel } from '../../shared/lib/format'
import { MapDetailIcon, type MapDetailIconName } from '../../shared/ui/mapDetailIcons'

type MapDetailInfoCardProps = {
  shop: Shop
  description?: string | null
  floorLabel: string | null
  distanceLabel?: string | null
  onOpenDirections: (event?: { stopPropagation: () => void }) => void
}

function MapDetailRow({
  className,
  icon,
  label,
  description,
  descriptionAction,
  right,
}: {
  className?: string
  icon: MapDetailIconName
  label: string
  description: ReactNode
  descriptionAction?: ReactNode
  right?: ReactNode
}) {
  return (
    <ListRow
      border="none"
      className={['map-sheet-detail-row-v3', className].filter(Boolean).join(' ')}
      left={<span className="map-sheet-detail-icon">
        <MapDetailIcon name={icon} />
      </span>}
      contents={
        <div className="map-sheet-detail-copy">
          <span>{label}</span>
          {descriptionAction ? (
            <div className="map-sheet-detail-value-row">
              <strong>{description}</strong>
              {descriptionAction}
            </div>
          ) : (
            <strong>{description}</strong>
          )}
        </div>
      }
      right={right}
      verticalPadding="small"
    />
  )
}

export function MapDetailInfoCard({
  shop,
  description,
  floorLabel,
  distanceLabel,
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

  return (
    <section className="section map-sheet-info-card" id="map-place-info">
      {visibleAiSummary ? (
        <div
          className={[
            'map-sheet-ai-summary',
            'map-sheet-ai-summary-priority',
            isAiSummaryExpanded ? 'map-sheet-ai-summary-expanded' : null,
          ].filter(Boolean).join(' ')}
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
          description={shop.address}
          descriptionAction={
            <Button
              className="map-place-directions-button"
              color="primary"
              size="small"
              variant="weak"
              onClick={onOpenDirections}
            >
              길찾기
            </Button>
          }
        />

        <MapDetailRow
          icon="building"
          label="위치"
          description={[shop.regionName, floorLabel ?? '층 정보 확인 필요', distanceLabel].filter(Boolean).join(' · ')}
        />

        <MapDetailRow icon="clock" label="영업 상태" description={statusToLabel(shop.status)} />

        <MapDetailRow
          icon="collection"
          label="취급 정보"
          description={
            shop.categories.length > 0
              ? shop.categories.slice(0, 6).map((category) => category.name).join(' · ')
              : '등록된 분류 정보가 없어요.'
          }
        />

        {shouldShowVisitTip ? (
          <MapDetailRow icon="sparkle" label="방문 팁" description={shop.visitTip} />
        ) : null}

        <MapDetailRow icon="calendar" label="최근 업데이트" description={updatedLabel} />
      </ul>
    </section>
  )
}
