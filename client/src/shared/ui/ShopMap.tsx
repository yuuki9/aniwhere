import { useEffect, useMemo, useRef, useState } from 'react'
import type { Shop } from '../api/types'
import type { UserLocation } from '../lib/location'
import { loadNaverMaps } from '../lib/naverMapLoader'

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
  onReady?: () => void
}

type MarkerWithListeners = {
  marker: naver.maps.Marker
  listeners: naver.maps.MapEventListener[]
}

type ShopMarkerGroup =
  | {
      type: 'shop'
      shop: Shop
    }
  | {
      type: 'cluster'
      id: string
      shops: Shop[]
      latitude: number
      longitude: number
    }

const MIN_ZOOM = 7
const MAX_ZOOM = 19
const INITIAL_ZOOM = 14
const CLUSTER_BREAK_ZOOM = 16

function createMarkerIcon(className: string, label: string, size: number) {
  return {
    content: `<span class="${className}" aria-hidden="true">${label}</span>`,
    size: new naver.maps.Size(size, size),
    anchor: new naver.maps.Point(size / 2, size / 2),
  }
}

function toLatLng(latitude: number, longitude: number) {
  return new naver.maps.LatLng(latitude, longitude)
}

function getClusterCellSize(zoom: number) {
  if (zoom <= 11) {
    return 0.08
  }

  if (zoom <= 13) {
    return 0.035
  }

  return 0.014
}

function getClusterIconSize(count: number) {
  if (count >= 20) {
    return 42
  }

  if (count >= 10) {
    return 38
  }

  return 34
}

function buildMarkerGroups(shops: Shop[], zoom: number, activeShopId: number | null): ShopMarkerGroup[] {
  if (zoom >= CLUSTER_BREAK_ZOOM) {
    return shops.map((shop) => ({ type: 'shop', shop }))
  }

  const cellSize = getClusterCellSize(zoom)
  const groups = new Map<string, Shop[]>()

  shops.forEach((shop) => {
    if (shop.id === activeShopId) {
      groups.set(`active-${shop.id}`, [shop])
      return
    }

    const key = `${Math.floor(shop.py / cellSize)}:${Math.floor(shop.px / cellSize)}`
    const group = groups.get(key)

    if (group) {
      group.push(shop)
      return
    }

    groups.set(key, [shop])
  })

  return Array.from(groups.entries()).map(([id, group]) => {
    if (group.length === 1) {
      return { type: 'shop', shop: group[0] }
    }

    const center = group.reduce(
      (acc, shop) => ({
        latitude: acc.latitude + shop.py,
        longitude: acc.longitude + shop.px,
      }),
      { latitude: 0, longitude: 0 },
    )

    return {
      type: 'cluster',
      id,
      shops: group,
      latitude: center.latitude / group.length,
      longitude: center.longitude / group.length,
    }
  })
}

function removeMarker(markerWithListeners: MarkerWithListeners) {
  naver.maps.Event.removeListener(markerWithListeners.listeners)
  markerWithListeners.marker.setMap(null)
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
  onReady,
}: ShopMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<naver.maps.Map | null>(null)
  const mapClickListenerRef = useRef<naver.maps.MapEventListener | null>(null)
  const mapZoomListenerRef = useRef<naver.maps.MapEventListener | null>(null)
  const shopMarkersRef = useRef<MarkerWithListeners[]>([])
  const userMarkerRef = useRef<MarkerWithListeners | null>(null)
  const lastAppliedFocusRef = useRef<number | null>(null)
  const readyNotifiedRef = useRef(false)
  const onClearSelectionRef = useRef(onClearSelection)
  const onReadyRef = useRef(onReady)
  const onSelectShopRef = useRef(onSelectShop)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [mapInitialized, setMapInitialized] = useState(false)
  const [currentZoom, setCurrentZoom] = useState(INITIAL_ZOOM)

  const validShops = useMemo(
    () => shops.filter((shop) => Number.isFinite(shop.px) && Number.isFinite(shop.py)),
    [shops],
  )
  const markerGroups = useMemo(
    () => buildMarkerGroups(validShops, currentZoom, activeShopId),
    [activeShopId, currentZoom, validShops],
  )

  const center = useMemo(() => {
    if (userLocation) {
      return {
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
      }
    }

    if (validShops.length === 0) {
      return {
        latitude: 37.5665,
        longitude: 126.978,
      }
    }

    const total = validShops.reduce(
      (acc, shop) => ({
        latitude: acc.latitude + shop.py,
        longitude: acc.longitude + shop.px,
      }),
      { latitude: 0, longitude: 0 },
    )

    return {
      latitude: total.latitude / validShops.length,
      longitude: total.longitude / validShops.length,
    }
  }, [userLocation, validShops])
  const initialCenterRef = useRef(center)

  useEffect(() => {
    onClearSelectionRef.current = onClearSelection
    onReadyRef.current = onReady
    onSelectShopRef.current = onSelectShop
  }, [onClearSelection, onReady, onSelectShop])

  useEffect(() => {
    let cancelled = false
    const initialCenter = initialCenterRef.current

    loadNaverMaps()
      .then((maps) => {
        if (cancelled || !containerRef.current || mapRef.current) {
          return
        }

        const map = new maps.Map(containerRef.current, {
          center: new maps.LatLng(initialCenter.latitude, initialCenter.longitude),
          zoom: INITIAL_ZOOM,
          minZoom: MIN_ZOOM,
          maxZoom: MAX_ZOOM,
          scrollWheel: true,
          pinchZoom: true,
          logoControl: true,
          logoControlOptions: {
            position: maps.Position.BOTTOM_LEFT,
          },
          mapDataControl: true,
          mapDataControlOptions: {
            position: maps.Position.BOTTOM_LEFT,
          },
          scaleControl: false,
          zoomControl: false,
        })

        mapRef.current = map
        setCurrentZoom(map.getZoom())
        setMapInitialized(true)
        mapClickListenerRef.current = maps.Event.addListener(map, 'click', () => {
          onClearSelectionRef.current?.()
        })
        mapZoomListenerRef.current = maps.Event.addListener(map, 'zoom_changed', () => {
          setCurrentZoom(map.getZoom())
        })

        maps.Event.once(map, 'idle', () => {
          if (!readyNotifiedRef.current) {
            readyNotifiedRef.current = true
            onReadyRef.current?.()
          }
        })
      })
      .catch((error) => {
        if (!cancelled) {
          setLoadError(error instanceof Error ? error.message : '네이버 지도를 불러오지 못했습니다.')
        }
      })

    return () => {
      cancelled = true
      shopMarkersRef.current.forEach(removeMarker)
      shopMarkersRef.current = []

      if (userMarkerRef.current) {
        removeMarker(userMarkerRef.current)
        userMarkerRef.current = null
      }

      if (mapClickListenerRef.current) {
        naver.maps.Event.removeListener(mapClickListenerRef.current)
        mapClickListenerRef.current = null
      }

      if (mapZoomListenerRef.current) {
        naver.maps.Event.removeListener(mapZoomListenerRef.current)
        mapZoomListenerRef.current = null
      }

      mapRef.current?.destroy()
      mapRef.current = null
    }
  }, [])

  useEffect(() => {
    const map = mapRef.current

    if (!mapInitialized || !map) {
      return
    }

    shopMarkersRef.current.forEach(removeMarker)
    shopMarkersRef.current = markerGroups.map((group) => {
      if (group.type === 'cluster') {
        const size = getClusterIconSize(group.shops.length)
        const marker = new naver.maps.Marker({
          map,
          position: toLatLng(group.latitude, group.longitude),
          title: `${group.shops.length}개 매장`,
          clickable: true,
          zIndex: 8,
          icon: createMarkerIcon('map-naver-cluster-marker', String(group.shops.length), size),
        })
        const listener = naver.maps.Event.addListener(marker, 'click', () => {
          map.morph(toLatLng(group.latitude, group.longitude), Math.min(MAX_ZOOM, Math.max(CLUSTER_BREAK_ZOOM, currentZoom + 2)))
        })

        return {
          marker,
          listeners: [listener],
        }
      }

      const isActive = activeShopId === group.shop.id
      const marker = new naver.maps.Marker({
        map,
        position: toLatLng(group.shop.py, group.shop.px),
        title: group.shop.name,
        clickable: true,
        zIndex: isActive ? 20 : 10,
        icon: createMarkerIcon(
          `map-naver-marker ${isActive ? 'map-naver-marker-active' : ''}`,
          '',
          isActive ? 24 : 18,
        ),
      })
      const listener = naver.maps.Event.addListener(marker, 'click', () => {
        onSelectShopRef.current(group.shop.id)
      })

      return {
        marker,
        listeners: [listener],
      }
    })
  }, [activeShopId, currentZoom, mapInitialized, markerGroups])

  useEffect(() => {
    const map = mapRef.current

    if (!mapInitialized || !map) {
      return
    }

    if (userMarkerRef.current) {
      removeMarker(userMarkerRef.current)
      userMarkerRef.current = null
    }

    if (!userLocation) {
      return
    }

    const marker = new naver.maps.Marker({
      map,
      position: toLatLng(userLocation.latitude, userLocation.longitude),
      title: '현재 위치',
      clickable: false,
      zIndex: 30,
      icon: createMarkerIcon('map-naver-user-marker', '', 28),
    })

    userMarkerRef.current = {
      marker,
      listeners: [],
    }
  }, [mapInitialized, userLocation])

  useEffect(() => {
    const map = mapRef.current

    if (!mapInitialized || !map || focusMode === 'idle' || lastAppliedFocusRef.current === focusRequestId) {
      return
    }

    if (focusMode === 'user' && userLocation) {
      map.morph(toLatLng(userLocation.latitude, userLocation.longitude), 15)
      lastAppliedFocusRef.current = focusRequestId
      return
    }

    if (validShops.length === 0) {
      return
    }

    if (focusMode === 'shop' && activeShopId) {
      const active = validShops.find((shop) => shop.id === activeShopId)

      if (active) {
        const nextZoom = Math.max(map.getZoom(), 16)

        if (selectionOrigin === 'list') {
          map.setCenter(toLatLng(active.py, active.px))
          map.setZoom(nextZoom)
        } else {
          map.morph(toLatLng(active.py, active.px), nextZoom)
        }

        lastAppliedFocusRef.current = focusRequestId
        return
      }
    }

    if (validShops.length === 1) {
      const [only] = validShops
      map.setCenter(toLatLng(only.py, only.px))
      map.setZoom(16)
      lastAppliedFocusRef.current = focusRequestId
      return
    }

    map.fitBounds(
      validShops.map((shop) => toLatLng(shop.py, shop.px)),
      {
        top: 120,
        right: 24,
        bottom: 160,
        left: 24,
      },
    )

    window.setTimeout(() => {
      if (map.getZoom() > 16) {
        map.setZoom(16)
      }
    }, 0)
    lastAppliedFocusRef.current = focusRequestId
  }, [activeShopId, focusMode, focusRequestId, mapInitialized, selectionOrigin, userLocation, validShops])

  const changeZoom = (direction: 1 | -1) => {
    const map = mapRef.current

    if (!map) {
      return
    }

    const nextZoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, map.getZoom() + direction))
    map.setZoom(nextZoom)
    setCurrentZoom(nextZoom)
  }

  if (loadError) {
    return (
      <div className="map-empty">
        <p>{loadError}</p>
      </div>
    )
  }

  if (validShops.length === 0 && !userLocation) {
    return (
      <div className="map-empty">
        <p>지도에 표시할 좌표가 없습니다.</p>
      </div>
    )
  }

  return (
    <>
      <div className="map-naver" ref={containerRef} />
      {mapInitialized ? (
        <div className="map-zoom-control" aria-label="지도 확대 축소">
          <button
            aria-label="지도 확대"
            className="map-zoom-button"
            disabled={currentZoom >= MAX_ZOOM}
            type="button"
            onClick={() => changeZoom(1)}
          >
            +
          </button>
          <span className="map-zoom-divider" aria-hidden="true" />
          <button
            aria-label="지도 축소"
            className="map-zoom-button"
            disabled={currentZoom <= MIN_ZOOM}
            type="button"
            onClick={() => changeZoom(-1)}
          >
            -
          </button>
        </div>
      ) : null}
    </>
  )
}
