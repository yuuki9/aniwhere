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
  const relativeUpdated = formatRelativeUpdated(shop.updatedAt)
  const updatedNote = relativeUpdated.endsWith('업데이트') ? `${relativeUpdated} 됨` : `${relativeUpdated} 업데이트됨`

  return (
    <section className="section map-sheet-info-card map-sheet-info-list-v2 map-sheet-info-list-v3" id="map-place-info">
      <p className="map-sheet-updated-note">
        <span>{updatedNote}</span>
      </p>

      <MapDetailRow icon="pin" label="주소">
        <button className="map-place-address-button" type="button" onClick={onOpenDirections}>
          <span className="map-place-address-text">{shop.address}</span>
          <span className="map-place-address-action">
            <MapDetailIcon name="route" />
            길찾기
          </span>
        </button>
      </MapDetailRow>

      <MapDetailRow icon="layers" label="위치">
        {[shop.regionName, floorLabel ?? '층 정보 확인 필요', distanceLabel].filter(Boolean).join(' · ')}
      </MapDetailRow>

      <MapDetailRow icon="clock" label="운영 상태">
        {statusToLabel(shop.status)}
        {shop.sellsIchibanKuji ? ' · 이치방쿠지 취급' : ''}
      </MapDetailRow>

      <MapDetailRow icon="tag" label="취급 정보">
        {shop.categories.length > 0
          ? shop.categories.slice(0, 6).join(' · ')
          : '등록된 분류 정보가 없어요.'}
      </MapDetailRow>

      {shop.visitTip ? (
        <MapDetailRow icon="tag" label="방문 팁">
          {shop.visitTip}
        </MapDetailRow>
      ) : null}
    </section>
  )
}
