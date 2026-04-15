import { useEffect, useMemo, useRef } from 'react'
import type { CircleMarker as LeafletCircleMarker } from 'leaflet'
import { CircleMarker, MapContainer, Popup, TileLayer, useMap } from 'react-leaflet'
import type { Shop } from '../api/types'
import type { UserLocation } from '../lib/location'

type FocusMode = 'shops' | 'shop' | 'user'

type ShopMapProps = {
  shops: Shop[]
  activeShopId: number | null
  onSelectShop: (shopId: number) => void
  userLocation?: UserLocation | null
  focusMode?: FocusMode
}

function FitToTargets({
  shops,
  activeShopId,
  userLocation,
  focusMode = 'shops',
}: {
  shops: Shop[]
  activeShopId: number | null
  userLocation?: UserLocation | null
  focusMode?: FocusMode
}) {
  const map = useMap()

  useEffect(() => {
    if (focusMode === 'user' && userLocation) {
      map.setView([userLocation.latitude, userLocation.longitude], 15, { animate: true })
      return
    }

    if (shops.length === 0) {
      return
    }

    if (focusMode === 'shop' && activeShopId) {
      const active = shops.find((shop) => shop.id === activeShopId)
      if (active) {
        map.setView([active.py, active.px], Math.max(map.getZoom(), 15), { animate: true })
        return
      }
    }

    if (shops.length === 1) {
      const only = shops[0]
      map.setView([only.py, only.px], 16, { animate: false })
      return
    }

    const bounds = shops.map((shop) => [shop.py, shop.px] as [number, number])
    map.fitBounds(bounds, { padding: [32, 32], maxZoom: 16 })
  }, [activeShopId, focusMode, map, shops, userLocation])

  return null
}

function SyncActivePopup({
  activeShopId,
  focusMode = 'shops',
  markersRef,
}: {
  activeShopId: number | null
  focusMode?: FocusMode
  markersRef: React.MutableRefObject<Record<number, LeafletCircleMarker | null>>
}) {
  useEffect(() => {
    if (focusMode === 'user') {
      Object.values(markersRef.current).forEach((marker) => marker?.closePopup())
      return
    }

    if (!activeShopId) {
      Object.values(markersRef.current).forEach((marker) => marker?.closePopup())
      return
    }

    Object.entries(markersRef.current).forEach(([markerId, marker]) => {
      if (Number(markerId) !== activeShopId) {
        marker?.closePopup()
      }
    })

    const marker = markersRef.current[activeShopId]
    marker?.openPopup()
  }, [activeShopId, focusMode, markersRef])

  return null
}

export function ShopMap({
  shops,
  activeShopId,
  onSelectShop,
  userLocation = null,
  focusMode = 'shops',
}: ShopMapProps) {
  const markersRef = useRef<Record<number, LeafletCircleMarker | null>>({})
  const validShops = useMemo(
    () => shops.filter((shop) => Number.isFinite(shop.px) && Number.isFinite(shop.py)),
    [shops],
  )

  const center = useMemo<[number, number]>(() => {
    if (userLocation) {
      return [userLocation.latitude, userLocation.longitude]
    }

    if (validShops.length === 0) {
      return [37.5665, 126.978]
    }

    const total = validShops.reduce(
      (acc, shop) => ({
        lat: acc.lat + shop.py,
        lng: acc.lng + shop.px,
      }),
      { lat: 0, lng: 0 },
    )

    return [total.lat / validShops.length, total.lng / validShops.length]
  }, [userLocation, validShops])

  if (validShops.length === 0 && !userLocation) {
    return (
      <div className="map-empty">
        <p>지도에 표시할 좌표가 없습니다.</p>
      </div>
    )
  }

  return (
    <MapContainer center={center} zoom={14} className="map-leaflet" scrollWheelZoom>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {userLocation ? (
        <CircleMarker
          center={[userLocation.latitude, userLocation.longitude]}
          radius={9}
          pathOptions={{
            color: '#ffffff',
            fillColor: '#1b5cff',
            fillOpacity: 1,
            weight: 3,
          }}
        >
          <Popup autoClose={false} closeButton={false} closeOnClick={false} offset={[0, -10]}>
            <div className="map-poi-popup">
              <strong>현재 위치</strong>
              <span>이 주변 매장을 먼저 둘러보세요.</span>
            </div>
          </Popup>
        </CircleMarker>
      ) : null}

      {validShops.map((shop, index) => {
        const isActive = activeShopId === shop.id
        return (
          <CircleMarker
            key={shop.id}
            center={[shop.py, shop.px]}
            ref={(marker) => {
              markersRef.current[shop.id] = marker
            }}
            radius={isActive ? 12 : 9}
            pathOptions={{
              color: isActive ? '#1b5cff' : '#ffffff',
              fillColor: isActive ? '#1b5cff' : '#ff7a00',
              fillOpacity: 1,
              weight: 2,
            }}
            eventHandlers={{
              click: () => onSelectShop(shop.id),
            }}
          >
            <Popup autoClose={false} closeButton={false} closeOnClick={false} offset={[0, -14]}>
              <div className="map-poi-popup">
                <strong>
                  {index + 1}. {shop.name}
                </strong>
                <span>{shop.address}</span>
              </div>
            </Popup>
          </CircleMarker>
        )
      })}

      <FitToTargets shops={validShops} activeShopId={activeShopId} userLocation={userLocation} focusMode={focusMode} />
      <SyncActivePopup activeShopId={activeShopId} focusMode={focusMode} markersRef={markersRef} />
    </MapContainer>
  )
}
