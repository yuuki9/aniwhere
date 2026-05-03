import type { ReactNode } from 'react'
import type { Shop } from '../../shared/api/types'
import { formatRelativeUpdated, statusToLabel } from '../../shared/lib/format'
import { MapDetailIcon, type MapDetailIconName } from '../../shared/ui/mapDetailIcons'

type MapDetailInfoCardProps = {
  shop: Shop
  floorLabel: string | null
  distanceLabel?: string | null
  onOpenDirections: (event?: { stopPropagation: () => void }) => void
}

function MapDetailRow({
  icon,
  label,
  children,
}: {
  icon: MapDetailIconName
  label: string
  children: ReactNode
}) {
  return (
    <div className="map-sheet-detail-row-v3">
      <span className="map-sheet-detail-icon">
        <MapDetailIcon name={icon} />
      </span>
      <div className="map-sheet-detail-copy">
        <span>{label}</span>
        <strong>{children}</strong>
      </div>
    </div>
  )
}

export function MapDetailInfoCard({ shop, floorLabel, distanceLabel, onOpenDirections }: MapDetailInfoCardProps) {
  return (
    <section className="section map-sheet-info-card map-sheet-info-list-v2 map-sheet-info-list-v3" id="map-place-info">
      <MapDetailRow icon="pin" label="주소">
        <button className="map-place-address-button" type="button" onClick={onOpenDirections}>
          {shop.address}
          <span>네이버 지도 웹</span>
        </button>
      </MapDetailRow>
      <MapDetailRow icon="layers" label="운영 정보">
        {floorLabel ?? '층 정보 확인 필요'} · {statusToLabel(shop.status)}
        {shop.sellsIchibanKuji ? ' · 일번쿠지 취급' : ''}
      </MapDetailRow>
      <MapDetailRow icon="tag" label="취급 / 분류">
        {shop.works.length > 0
          ? `${shop.works.slice(0, 4).join(' · ')}${shop.works.length > 4 ? ` 외 ${shop.works.length - 4}개` : ''}`
          : shop.categories.length > 0
            ? shop.categories.join(' · ')
            : '등록된 작품 정보 없음'}
      </MapDetailRow>
      {shop.visitTip ? (
        <MapDetailRow icon="tag" label="방문 팁">
          {shop.visitTip}
        </MapDetailRow>
      ) : null}
      <MapDetailRow icon="clock" label="업데이트">
        {formatRelativeUpdated(shop.updatedAt)}
        {distanceLabel ? ` · ${distanceLabel}` : ''}
      </MapDetailRow>
    </section>
  )
}
