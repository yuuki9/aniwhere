import { useEffect, useMemo, useRef } from 'react'
import { CircleMarker, MapContainer, TileLayer, ZoomControl, useMap, useMapEvents } from 'react-leaflet'
import type { Shop } from '../api/types'
import type { UserLocation } from '../lib/location'

type FocusMode = 'shops' | 'shop' | 'user' | 'idle'

type ShopMapProps = {
  shops: Shop[]
  activeShopId: number | null
  onSelectShop: (shopId: number) => void
  onClearSelection?: () => void
  userLocation?: UserLocation | null
  focusMode?: FocusMode
  focusRequestId?: number
  selectionOrigin?: 'map' | 'list' | null
}

function MapBackgroundClick({ onClearSelection }: { onClearSelection?: () => void }) {
  useMapEvents({
    click: () => {
      onClearSelection?.()
    },
  })

  return null
}

function FitToTargets({
  shops,
  activeShopId,
  userLocation,
  focusMode = 'shops',
  focusRequestId = 0,
  selectionOrigin = null,
}: {
  shops: Shop[]
  activeShopId: number | null
  userLocation?: UserLocation | null
  focusMode?: FocusMode
  focusRequestId?: number
  selectionOrigin?: 'map' | 'list' | null
}) {
  const map = useMap()
  const lastAppliedFocusRef = useRef<number | null>(null)

  useEffect(() => {
    if (focusMode === 'idle' || lastAppliedFocusRef.current === focusRequestId) {
      return
    }

    if (focusMode === 'user' && userLocation) {
      map.setView([userLocation.latitude, userLocation.longitude], 15, { animate: true })
      lastAppliedFocusRef.current = focusRequestId
      return
    }

    if (shops.length === 0) {
      return
    }

    if (focusMode === 'shop' && activeShopId) {
      const active = shops.find((shop) => shop.id === activeShopId)
      if (active) {
        map.setView([active.py, active.px], Math.max(map.getZoom(), 16), {
          animate: selectionOrigin !== 'list',
        })
        lastAppliedFocusRef.current = focusRequestId
        return
      }
    }

    if (shops.length === 1) {
      const only = shops[0]
      map.setView([only.py, only.px], 16, { animate: false })
      lastAppliedFocusRef.current = focusRequestId
      return
    }

    const bounds = shops.map((shop) => [shop.py, shop.px] as [number, number])
    map.fitBounds(bounds, {
      paddingTopLeft: [24, 120],
      paddingBottomRight: [24, 160],
      maxZoom: 16,
    })
    lastAppliedFocusRef.current = focusRequestId
  }, [activeShopId, focusMode, focusRequestId, map, selectionOrigin, shops, userLocation])

  return null
}

export function ShopMap({
  shops,
  activeShopId,
  onSelectShop,
  onClearSelection,
  userLocation = null,
  focusMode = 'shops',
  focusRequestId = 0,
  selectionOrigin = null,
}: ShopMapProps) {
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
    <MapContainer center={center} zoom={14} className="map-leaflet" scrollWheelZoom zoomControl={false}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <ZoomControl position="bottomright" />

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
        />
      ) : null}

      {validShops.map((shop) => {
        const isActive = activeShopId === shop.id

        return (
          <CircleMarker
            bubblingMouseEvents={false}
            key={shop.id}
            center={[shop.py, shop.px]}
            radius={isActive ? 11 : 8}
            pathOptions={{
              color: isActive ? '#1b5cff' : '#ffffff',
              fillColor: isActive ? '#1b5cff' : '#ff7a00',
              fillOpacity: 1,
              weight: isActive ? 3 : 2,
            }}
            eventHandlers={{
              click: () => onSelectShop(shop.id),
            }}
          />
        )
      })}

      <FitToTargets
        shops={validShops}
        activeShopId={activeShopId}
        userLocation={userLocation}
        focusMode={focusMode}
        focusRequestId={focusRequestId}
        selectionOrigin={selectionOrigin}
      />
      <MapBackgroundClick onClearSelection={onClearSelection} />
    </MapContainer>
  )
}
