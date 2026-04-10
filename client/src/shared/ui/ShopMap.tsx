import { useEffect, useMemo } from 'react'
import { CircleMarker, MapContainer, TileLayer, Tooltip, useMap } from 'react-leaflet'
import type { Shop } from '../api/types'

type ShopMapProps = {
  shops: Shop[]
  activeShopId: number | null
  onSelectShop: (shopId: number) => void
}

function FitToShops({ shops, activeShopId }: { shops: Shop[]; activeShopId: number | null }) {
  const map = useMap()

  useEffect(() => {
    if (shops.length === 0) {
      return
    }

    if (shops.length === 1) {
      const only = shops[0]
      map.setView([only.py, only.px], 16, { animate: false })
      return
    }

    if (activeShopId) {
      const active = shops.find((shop) => shop.id === activeShopId)
      if (active) {
        map.setView([active.py, active.px], Math.max(map.getZoom(), 15), { animate: true })
        return
      }
    }

    const bounds = shops.map((shop) => [shop.py, shop.px] as [number, number])
    map.fitBounds(bounds, { padding: [24, 24], maxZoom: 16 })
  }, [activeShopId, map, shops])

  return null
}

export function ShopMap({ shops, activeShopId, onSelectShop }: ShopMapProps) {
  const validShops = useMemo(
    () => shops.filter((shop) => Number.isFinite(shop.px) && Number.isFinite(shop.py)),
    [shops],
  )

  const center = useMemo<[number, number]>(() => {
    if (validShops.length === 0) {
      return [37.5665, 126.978]
    }
    const total = validShops.reduce(
      (acc, shop) => {
        return {
          lat: acc.lat + shop.py,
          lng: acc.lng + shop.px,
        }
      },
      { lat: 0, lng: 0 },
    )
    return [total.lat / validShops.length, total.lng / validShops.length]
  }, [validShops])

  if (validShops.length === 0) {
    return (
      <div className="map-empty">
        <p>No map coordinates are available for this filter.</p>
      </div>
    )
  }

  return (
    <MapContainer center={center} zoom={14} className="map-leaflet" scrollWheelZoom>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {validShops.map((shop, index) => {
        const isActive = activeShopId === shop.id
        return (
          <CircleMarker
            key={shop.id}
            center={[shop.py, shop.px]}
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
            <Tooltip direction="top" offset={[0, -8]} opacity={1} permanent={isActive}>
              {index + 1}. {shop.name}
            </Tooltip>
          </CircleMarker>
        )
      })}
      <FitToShops shops={validShops} activeShopId={activeShopId} />
    </MapContainer>
  )
}
