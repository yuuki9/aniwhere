import { useEffect, useMemo, useRef, useState } from 'react'
import type { Shop } from '../api/types'
import type { UserLocation } from '../lib/location'
import { loadNaverMaps } from '../lib/naverMapLoader'

type FocusMode = 'shops' | 'shop' | 'user' | 'idle'

export type MapViewport = {
  center: UserLocation
  bounds: {
    northEast: UserLocation
    southWest: UserLocation
  }
  zoom: number
}

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
  onViewportChange?: (viewport: MapViewport) => void
}

type MarkerWithListeners = {
  marker: naver.maps.Marker
  listeners: naver.maps.MapEventListener[]
}

type PartialNaverMapNamespace = Partial<typeof naver.maps>

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
const VIEWPORT_COORDINATE_EPSILON = 0.00005
const SHOP_MARKER_HEIGHT = 32
const SHOP_MARKER_MIN_WIDTH = 64
const SHOP_MARKER_MAX_WIDTH = 220

function createMarkerIcon(className: string, label: string, size: number) {
  const maps = getRequiredNaverMaps()

  return {
    content: `<span class="${className}" style="width:${size}px;height:${size}px" aria-hidden="true">${label}</span>`,
    size: new maps.Size(size, size),
    anchor: new maps.Point(size / 2, size / 2),
  }
}

function canCreateNaverMarkers() {
  return isUsableNaverMarkerMaps(window.naver?.maps)
}

function isUsableNaverMarkerMaps(maps: PartialNaverMapNamespace | null | undefined): maps is typeof naver.maps {
  if (!maps) {
    return false
  }

  return (
    maps.Marker != null &&
    maps.Event != null &&
    maps.Size != null &&
    maps.Point != null &&
    maps.LatLng != null
  )
}

function getRequiredNaverMaps() {
  const maps = window.naver?.maps

  if (!isUsableNaverMarkerMaps(maps)) {
    throw new Error('네이버 지도 SDK를 초기화하지 못했습니다.')
  }

  return maps
}

function escapeMarkerLabel(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function getShopMarkerLabel(shop: Shop) {
  return shop.name.trim() || '매장'
}

function getChipMarkerWidth(label: string) {
  const estimatedWidth = Array.from(label).length * 12 + 26

  return Math.min(SHOP_MARKER_MAX_WIDTH, Math.max(SHOP_MARKER_MIN_WIDTH, estimatedWidth))
}

function createShopMarkerIcon(shop: Shop, isActive: boolean) {
  const maps = getRequiredNaverMaps()
  const label = getShopMarkerLabel(shop)
  const width = getChipMarkerWidth(label)

  return {
    content: `<span class="map-naver-shop-marker" aria-hidden="true"><span class="map-naver-shop-chip${isActive ? ' map-naver-shop-chip-active' : ''}"><span class="map-naver-shop-chip-label">${escapeMarkerLabel(label)}</span></span></span>`,
    size: new maps.Size(width, SHOP_MARKER_HEIGHT),
    anchor: new maps.Point(width / 2, SHOP_MARKER_HEIGHT + 8),
  }
}

function createClusterMarkerIcon(count: number) {
  const maps = getRequiredNaverMaps()
  const label = `${count}곳`
  const width = getChipMarkerWidth(label)

  return {
    content: `<span class="map-naver-cluster-chip" aria-hidden="true"><span class="map-naver-cluster-chip-count">${escapeMarkerLabel(label)}</span></span>`,
    size: new maps.Size(width, SHOP_MARKER_HEIGHT),
    anchor: new maps.Point(width / 2, SHOP_MARKER_HEIGHT + 8),
  }
}

function toLatLng(latitude: number, longitude: number) {
  const maps = getRequiredNaverMaps()

  return new maps.LatLng(latitude, longitude)
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
  window.naver?.maps?.Event?.removeListener(markerWithListeners.listeners)
  try {
    markerWithListeners.marker.setMap(null)
  } catch {
    // Naver Maps can throw during route teardown after its internal map reference is already cleared.
  }
}

function removeMapListener(listener: naver.maps.MapEventListener | null) {
  if (!listener) {
    return
  }

  window.naver?.maps?.Event?.removeListener(listener)
}

function readMapViewport(map: naver.maps.Map): MapViewport {
  const center = map.getCenter()
  const bounds = map.getBounds()
  const northEast = bounds.getNE()
  const southWest = bounds.getSW()

  return {
    center: {
      latitude: center.lat(),
      longitude: center.lng(),
    },
    bounds: {
      northEast: {
        latitude: northEast.lat(),
        longitude: northEast.lng(),
      },
      southWest: {
        latitude: southWest.lat(),
        longitude: southWest.lng(),
      },
    },
    zoom: map.getZoom(),
  }
}

function didCoordinateMove(previous: UserLocation, next: UserLocation) {
  return (
    Math.abs(previous.latitude - next.latitude) > VIEWPORT_COORDINATE_EPSILON ||
    Math.abs(previous.longitude - next.longitude) > VIEWPORT_COORDINATE_EPSILON
  )
}

function shouldPublishViewportChange(previous: MapViewport | null, next: MapViewport) {
  if (!previous) {
    return true
  }

  if (previous.zoom !== next.zoom) {
    return true
  }

  return (
    didCoordinateMove(previous.center, next.center) ||
    didCoordinateMove(previous.bounds.northEast, next.bounds.northEast) ||
    didCoordinateMove(previous.bounds.southWest, next.bounds.southWest)
  )
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
  onViewportChange,
}: ShopMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<naver.maps.Map | null>(null)
  const mapClickListenerRef = useRef<naver.maps.MapEventListener | null>(null)
  const mapIdleListenerRef = useRef<naver.maps.MapEventListener | null>(null)
  const mapZoomListenerRef = useRef<naver.maps.MapEventListener | null>(null)
  const shopMarkersRef = useRef<MarkerWithListeners[]>([])
  const userMarkerRef = useRef<MarkerWithListeners | null>(null)
  const lastAppliedFocusRef = useRef<number | null>(null)
  const lastPublishedViewportRef = useRef<MapViewport | null>(null)
  const readyNotifiedRef = useRef(false)
  const onClearSelectionRef = useRef(onClearSelection)
  const onReadyRef = useRef(onReady)
  const onSelectShopRef = useRef(onSelectShop)
  const onViewportChangeRef = useRef(onViewportChange)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [mapInitialized, setMapInitialized] = useState(false)
  const [currentZoom, setCurrentZoom] = useState(INITIAL_ZOOM)
  const [markerZoom, setMarkerZoom] = useState(INITIAL_ZOOM)

  const validShops = useMemo(
    () => shops.filter((shop) => Number.isFinite(shop.px) && Number.isFinite(shop.py)),
    [shops],
  )
  const markerGroups = useMemo(
    () => buildMarkerGroups(validShops, markerZoom, activeShopId),
    [activeShopId, markerZoom, validShops],
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
    onViewportChangeRef.current = onViewportChange
  }, [onClearSelection, onReady, onSelectShop, onViewportChange])

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
        const initialZoom = map.getZoom()
        setCurrentZoom(initialZoom)
        setMarkerZoom(initialZoom)
        setMapInitialized(true)
        mapClickListenerRef.current = maps.Event.addListener(map, 'click', () => {
          onClearSelectionRef.current?.()
        })
        mapZoomListenerRef.current = maps.Event.addListener(map, 'zoom_changed', () => {
          const nextZoom = map.getZoom()
          setCurrentZoom((previousZoom) => (previousZoom === nextZoom ? previousZoom : nextZoom))
        })
        mapIdleListenerRef.current = maps.Event.addListener(map, 'idle', () => {
          const nextViewport = readMapViewport(map)

          setMarkerZoom((previousZoom) => (previousZoom === nextViewport.zoom ? previousZoom : nextViewport.zoom))

          if (shouldPublishViewportChange(lastPublishedViewportRef.current, nextViewport)) {
            lastPublishedViewportRef.current = nextViewport
            onViewportChangeRef.current?.(nextViewport)
          }

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
        removeMapListener(mapClickListenerRef.current)
        mapClickListenerRef.current = null
      }

      if (mapZoomListenerRef.current) {
        removeMapListener(mapZoomListenerRef.current)
        mapZoomListenerRef.current = null
      }

      if (mapIdleListenerRef.current) {
        removeMapListener(mapIdleListenerRef.current)
        mapIdleListenerRef.current = null
      }

      try {
        mapRef.current?.destroy()
      } catch {
        // Naver Maps cleanup may race with route transitions in WebView/headless environments.
      }
      mapRef.current = null
    }
  }, [])

  useEffect(() => {
    const map = mapRef.current

    if (!mapInitialized || !map || !canCreateNaverMarkers()) {
      return
    }

    const maps = getRequiredNaverMaps()
    shopMarkersRef.current.forEach(removeMarker)
    shopMarkersRef.current = markerGroups.map((group) => {
      if (group.type === 'cluster') {
        const marker = new maps.Marker({
          map,
          position: toLatLng(group.latitude, group.longitude),
          title: `${group.shops.length}개 매장`,
          clickable: true,
          zIndex: 8,
          icon: createClusterMarkerIcon(group.shops.length),
        })
        const listener = maps.Event.addListener(marker, 'click', () => {
          map.morph(
            toLatLng(group.latitude, group.longitude),
            Math.min(MAX_ZOOM, Math.max(CLUSTER_BREAK_ZOOM, map.getZoom() + 2)),
          )
        })

        return {
          marker,
          listeners: [listener],
        }
      }

      const isActive = activeShopId === group.shop.id
      const marker = new maps.Marker({
        map,
        position: toLatLng(group.shop.py, group.shop.px),
        title: group.shop.name,
        clickable: true,
        zIndex: isActive ? 20 : 10,
        icon: createShopMarkerIcon(group.shop, isActive),
      })
      const listener = maps.Event.addListener(marker, 'click', () => {
        onSelectShopRef.current(group.shop.id)
      })

      return {
        marker,
        listeners: [listener],
      }
    })
  }, [activeShopId, mapInitialized, markerGroups])

  useEffect(() => {
    const map = mapRef.current

    if (!mapInitialized || !map || !canCreateNaverMarkers()) {
      return
    }

    if (userMarkerRef.current) {
      removeMarker(userMarkerRef.current)
      userMarkerRef.current = null
    }

    if (!userLocation) {
      return
    }

    const maps = getRequiredNaverMaps()
    const marker = new maps.Marker({
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
    setCurrentZoom((previousZoom) => (previousZoom === nextZoom ? previousZoom : nextZoom))
  }

  if (loadError) {
    return (
      <div className="map-empty">
        <p>{loadError}</p>
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
            <svg className="map-zoom-icon" aria-hidden="true" fill="none" viewBox="0 0 24 24">
              <path d="M12 5v14" />
              <path d="M5 12h14" />
            </svg>
          </button>
          <span className="map-zoom-divider" aria-hidden="true" />
          <button
            aria-label="지도 축소"
            className="map-zoom-button"
            disabled={currentZoom <= MIN_ZOOM}
            type="button"
            onClick={() => changeZoom(-1)}
          >
            <svg className="map-zoom-icon" aria-hidden="true" fill="none" viewBox="0 0 24 24">
              <path d="M5 12h14" />
            </svg>
          </button>
        </div>
      ) : null}
    </>
  )
}
