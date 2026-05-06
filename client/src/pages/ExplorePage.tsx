import { type UIEvent, useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { getShopPhotos } from '../shared/api/admin'
import { askMapAssistant } from '../shared/api/llm'
import { getShop, getShops } from '../shared/api/shops'
import type { AdminShopPhoto, Shop } from '../shared/api/types'
import {
  calculateDistanceKm,
  formatDistanceLabel,
  requestCurrentLocation,
  type UserLocation,
} from '../shared/lib/location'
import {
  buildNaverMapSearchUrl,
  buildNaverWebDirectionUrl,
  canBuildNaverWebDirectionUrl,
} from '../shared/lib/naverDirections'
import { isAppsInTossRuntime } from '../shared/lib/auth'
import { GlobalNavigationMenu } from '../shared/ui/GlobalNavigationMenu'
import { SearchFilterSheet } from '../shared/ui/SearchFilterSheet'
import { AitNavigation } from '../shared/ui/ait'
import { type MapViewport, ShopMap } from '../shared/ui/ShopMap'
import { MapAssistantPanel, type MapAssistantMessage } from './explore/MapAssistantPanel'
import { MapDetailInfoCard } from './explore/MapDetailInfoCard'
import { MapDetailMediaSection } from './explore/MapDetailMediaSection'
import { MapDetailSummaryCard } from './explore/MapDetailSummaryCard'
import { MapDetailSupplementSections } from './explore/MapDetailSupplementSections'
import { ExploreTopSearch } from './explore/ExploreTopSearch'
import { MapOverlayControls } from './explore/MapOverlayControls'
import { MapPeekSheet } from './explore/MapPeekSheet'
import { MapQuickChips, type MapQuickChipItem } from './explore/MapQuickChips'
import { MapResultsSheet } from './explore/MapResultsSheet'
import { readNearbyExploreParams } from './searchNearby'

const PAGE_SIZE = 10
const MAP_FETCH_SIZE = 200
const EMPTY_SHOPS: Shop[] = []
const DETAIL_MEDIA_TONES = ['blue', 'orange', 'mint', 'violet'] as const
const MAP_QUICK_CHIPS: MapQuickChipItem[] = [
  { id: 'favorite', label: '관심매장' },
  { id: 'active', label: '영업중' },
]
const ASSISTANT_SUGGESTIONS = ['홍대에서 일번쿠지 있는 곳', '피규어 종류가 많은 매장', '초행자에게 추천할 만한 곳']
const ASSISTANT_RETRY_HINT = '현재 데이터 기준으로 바로 맞는 후보를 찾지 못했어요. 작품명, 지역명, 매장명을 조금 더 구체적으로 입력해보세요.'

type FocusMode = 'shops' | 'shop' | 'user' | 'idle'
type ViewMode = 'map' | 'list'
type SheetMode = 'peek' | 'expanded'
type SelectionOrigin = 'map' | 'list' | null
type DetailMediaTone = (typeof DETAIL_MEDIA_TONES)[number]
type DetailMediaItem = {
  id: string
  src: string
  alt: string
}

type MapBounds = MapViewport['bounds']

function buildDescriptionPreview(description: string | null, maxLength = 120) {
  if (!description) {
    return null
  }

  const normalized = description.replace(/\s+/g, ' ').trim()

  if (normalized.length <= maxLength) {
    return normalized
  }

  return `${normalized.slice(0, maxLength).trimEnd()}…`
}

function shouldShowAssistantSuggestions(messages: MapAssistantMessage[]) {
  const userMessageCount = messages.filter((message) => message.role === 'user').length

  if (userMessageCount === 0) {
    return true
  }

  const lastAssistantMessage = [...messages].reverse().find((message) => message.role === 'assistant')

  if (!lastAssistantMessage) {
    return false
  }

  return lastAssistantMessage.content.includes('조금 더 구체적으로') || lastAssistantMessage.content.includes('찾지 못했어요')
}

function getDetailMediaTone(shopId: number): DetailMediaTone {
  return DETAIL_MEDIA_TONES[(Math.max(shopId, 1) - 1) % DETAIL_MEDIA_TONES.length]
}

function formatFloorLabel(floor: string | null) {
  if (!floor) {
    return null
  }

  const normalized = floor.trim()
  return normalized.endsWith('층') ? normalized : `${normalized}층`
}

function buildDetailMediaItems(shop: Shop, uploadedPhotos: AdminShopPhoto[] = []): DetailMediaItem[] {
  return uploadedPhotos.slice(0, 5).map((photo, index) => ({
    id: photo.id,
    src: photo.dataUrl,
    alt: `${shop.name} 실제 사진 ${index + 1}`,
  }))
}

function isShopInsideMapBounds(shop: Shop, bounds: MapBounds) {
  const isInsideLatitude = shop.py >= bounds.southWest.latitude && shop.py <= bounds.northEast.latitude
  const isInsideLongitude =
    bounds.southWest.longitude <= bounds.northEast.longitude
      ? shop.px >= bounds.southWest.longitude && shop.px <= bounds.northEast.longitude
      : shop.px >= bounds.southWest.longitude || shop.px <= bounds.northEast.longitude

  return isInsideLatitude && isInsideLongitude
}

export function ExplorePage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const regionId = Number(searchParams.get('regionId') ?? '') || undefined
  const selectedShopId = Number(searchParams.get('shopId') ?? '') || null
  const nearbyRequest = useMemo(() => readNearbyExploreParams(searchParams), [searchParams])
  const [focusMode, setFocusMode] = useState<FocusMode>(nearbyRequest ? 'user' : selectedShopId ? 'shop' : 'shops')
  const [focusRequestId, setFocusRequestId] = useState(1)
  const [viewMode, setViewMode] = useState<ViewMode>(nearbyRequest ? 'list' : 'map')
  const [sheetMode, setSheetMode] = useState<SheetMode>(selectedShopId ? 'peek' : 'peek')
  const [selectionOrigin, setSelectionOrigin] = useState<SelectionOrigin>(selectedShopId ? 'map' : null)
  const [visibleListCount, setVisibleListCount] = useState(PAGE_SIZE)
  const [userLocation, setUserLocation] = useState<UserLocation | null>(nearbyRequest?.location ?? null)
  const [locationState, setLocationState] = useState<'idle' | 'loading' | 'ready' | 'error'>(
    nearbyRequest ? 'ready' : 'idle',
  )
  const [locationError, setLocationError] = useState<string | null>(null)
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false)
  const [activeMapQuickChips, setActiveMapQuickChips] = useState<Record<string, boolean>>({})
  const [mapViewport, setMapViewport] = useState<MapViewport | null>(null)
  const [mapViewportFilter, setMapViewportFilter] = useState<MapBounds | null>(null)
  const [hasPendingMapSearch, setHasPendingMapSearch] = useState(false)
  const [shareFeedback, setShareFeedback] = useState<string | null>(null)
  const [isDetailHeaderCollapsed, setIsDetailHeaderCollapsed] = useState(false)
  const [peekDragOffset, setPeekDragOffset] = useState(0)
  const [isPeekDragging, setIsPeekDragging] = useState(false)
  const [assistantOpen, setAssistantOpen] = useState(false)
  const [assistantInput, setAssistantInput] = useState('')
  const [assistantMessages, setAssistantMessages] = useState<MapAssistantMessage[]>([
    {
      id: 'assistant-welcome',
      role: 'assistant',
      content: '작품명, 지역명, 일번쿠지 여부를 물어보면 지금 보이는 매장 기준으로 바로 추려드릴게요.',
    },
  ])
  const listScrollRef = useRef<HTMLDivElement | null>(null)
  const detailScrollRef = useRef<HTMLDivElement | null>(null)
  const assistantMessagesRef = useRef<HTMLDivElement | null>(null)
  const filterTriggerRef = useRef<HTMLButtonElement | null>(null)
  const hasMapViewportRef = useRef(false)
  const listScrollTopRef = useRef(0)
  const listVisibleCountRef = useRef(PAGE_SIZE)
  const pendingListRestoreRef = useRef(false)
  const peekPointerIdRef = useRef<number | null>(null)
  const peekDragStartYRef = useRef<number | null>(null)
  const peekMovedRef = useRef(false)
  const effectiveUserLocation = userLocation ?? nearbyRequest?.location ?? null
  const appliedFilterCount = mapViewportFilter ? 1 : 0
  const usesTossNavigation = useMemo(() => isAppsInTossRuntime(), [])

  const shopsQuery = useQuery({
    queryKey: ['shops', 'explore-map-source'],
    queryFn: () => getShops({ page: 0, size: MAP_FETCH_SIZE }),
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  })

  const activeShopDetailQuery = useQuery({
    queryKey: ['shops', 'explore-active-detail', selectedShopId],
    queryFn: () => getShop(selectedShopId as number),
    enabled: selectedShopId != null,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  })

  const detailPhotosQuery = useQuery({
    queryKey: ['admin-shop-photos', selectedShopId],
    queryFn: () => getShopPhotos(selectedShopId as number),
    enabled: selectedShopId != null,
    staleTime: Infinity,
  })

  const allShops = useMemo(() => shopsQuery.data?.content ?? EMPTY_SHOPS, [shopsQuery.data?.content])

  const filteredShops = useMemo(() => {
    return allShops.filter((shop) => {
      if (regionId && shop.regionId !== regionId) {
        return false
      }

      if (mapViewportFilter && !isShopInsideMapBounds(shop, mapViewportFilter)) {
        return false
      }

      return true
    })
  }, [allShops, mapViewportFilter, regionId])

  const shopsWithDistance = useMemo(() => {
    const nextShops = filteredShops.map((shop) => {
      if (!effectiveUserLocation || !Number.isFinite(shop.px) || !Number.isFinite(shop.py)) {
        return { ...shop, distanceKm: null, distanceLabel: null }
      }

      const distanceKm = calculateDistanceKm(effectiveUserLocation, {
        latitude: shop.py,
        longitude: shop.px,
      })

      return {
        ...shop,
        distanceKm,
        distanceLabel: formatDistanceLabel(distanceKm),
      }
    })

    if (!effectiveUserLocation) {
      return nextShops
    }

    const radiusFilteredShops = nearbyRequest
      ? nextShops.filter((shop) => shop.distanceKm != null && shop.distanceKm <= nearbyRequest.radiusKm)
      : nextShops

    return [...radiusFilteredShops].sort((a, b) => (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity))
  }, [effectiveUserLocation, filteredShops, nearbyRequest])

  const mappableShops = useMemo(
    () => shopsWithDistance.filter((shop) => Number.isFinite(shop.px) && Number.isFinite(shop.py)),
    [shopsWithDistance],
  )
  const totalShops = shopsWithDistance.length
  const visibleShops = useMemo(
    () => shopsWithDistance.slice(0, Math.min(visibleListCount, totalShops)),
    [shopsWithDistance, totalShops, visibleListCount],
  )

  const activeShop = useMemo(() => {
    if (selectedShopId == null) {
      return null
    }

    return shopsWithDistance.find((shop) => shop.id === selectedShopId) ?? null
  }, [selectedShopId, shopsWithDistance])

  const detailShop = activeShopDetailQuery.data ?? activeShop ?? null

  const relatedShops = useMemo(() => {
    if (!detailShop) {
      return []
    }

    const categoriesSet = new Set(detailShop.categories)

    return allShops
      .filter((shop) => shop.id !== detailShop.id)
      .map((shop) => {
        const sharedCategoryCount = shop.categories.filter((item) => categoriesSet.has(item)).length
        const sameRegionBonus = shop.regionId && detailShop.regionId && shop.regionId === detailShop.regionId ? 2 : 0
        const score = sharedCategoryCount + sameRegionBonus

        return { shop, score }
      })
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 6)
      .map((item) => item.shop)
  }, [allShops, detailShop])

  const assistantMutation = useMutation({
    mutationFn: async (question: string) =>
      askMapAssistant({
        question,
        shops: shopsWithDistance,
        selectedShop: detailShop,
      }),
    onSuccess: (reply) => {
      const summary =
        reply.recommendations.length === 0 && !reply.summary.includes('구체적으로')
          ? `${reply.summary} ${ASSISTANT_RETRY_HINT}`
          : reply.summary

      setAssistantMessages((current) => [
        ...current,
        {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: summary,
          recommendations: reply.recommendations,
        },
      ])
    },
    onError: (error) => {
      setAssistantMessages((current) => [
        ...current,
        {
          id: `assistant-error-${Date.now()}`,
          role: 'assistant',
          content: error instanceof Error ? error.message : 'AI 탐색 응답을 불러오지 못했습니다.',
        },
      ])
    },
  })

  const syncSearchParams = (next: URLSearchParams) => {
    setSearchParams(next, { replace: true })
  }

  const submitAssistantQuestion = (question: string) => {
    const normalizedQuestion = question.trim()

    if (!normalizedQuestion) {
      return
    }

    setAssistantMessages((current) => [
      ...current,
      {
        id: `user-${Date.now()}`,
        role: 'user',
        content: normalizedQuestion,
      },
    ])
    setAssistantInput('')
    assistantMutation.mutate(normalizedQuestion)
  }

  const requestMapFocus = useCallback((mode: FocusMode) => {
    setFocusMode(mode)
    setFocusRequestId((current) => current + 1)
  }, [])

  const handleSelectShop = (
    shopId: number,
    origin: Exclude<SelectionOrigin, null>,
    nextSheetMode: SheetMode = 'peek',
  ) => {
    const next = new URLSearchParams(searchParams)
    next.set('shopId', String(shopId))

    syncSearchParams(next)
    setSelectionOrigin(origin)
    setIsDetailHeaderCollapsed(false)
    setSheetMode(nextSheetMode)
    setAssistantOpen(false)
    if (origin === 'list') {
      requestMapFocus('shop')
    } else {
      setFocusMode('idle')
    }
    setViewMode('map')
  }

  const restoreListView = () => {
    const next = new URLSearchParams(searchParams)
    next.delete('shopId')
    syncSearchParams(next)
    pendingListRestoreRef.current = true
    setVisibleListCount(Math.max(PAGE_SIZE, listVisibleCountRef.current))
    setSheetMode('peek')
    setAssistantOpen(false)
    requestMapFocus('shops')
    setViewMode('list')
    setSelectionOrigin(null)
  }

  const handleClearSelection = () => {
    if (selectedShopId == null) {
      return
    }

    if (selectionOrigin === 'list') {
      restoreListView()
      return
    }

    const next = new URLSearchParams(searchParams)
    next.delete('shopId')
    syncSearchParams(next)
    setSheetMode('peek')
    setAssistantOpen(false)
    setFocusMode('idle')
    setViewMode('map')
    setSelectionOrigin(null)
  }

  const handleSwitchView = (nextView: ViewMode) => {
    if (nextView === 'map' && isListSheetOpen) {
      listScrollTopRef.current = listScrollRef.current?.scrollTop ?? 0
      listVisibleCountRef.current = visibleListCount
    }

    if (nextView === 'list') {
      setAssistantOpen(false)
    }

    setViewMode(nextView)
  }

  const handleListFabClick = () => {
    if (detailShop) {
      restoreListView()
      return
    }

    handleSwitchView(isListSheetOpen ? 'map' : 'list')
  }

  const handleRequestLocation = async () => {
    if (locationState === 'loading') {
      return
    }

    setLocationState('loading')
    setLocationError(null)

    try {
      const location = await requestCurrentLocation()
      setUserLocation(location)
      setLocationState('ready')
      requestMapFocus('user')
    } catch (error) {
      setLocationState('error')
      setLocationError(error instanceof Error ? error.message : '현재 위치를 가져오지 못했습니다.')
    }
  }

  const handleMapViewportChange = useCallback((viewport: MapViewport) => {
    if (hasMapViewportRef.current) {
      setHasPendingMapSearch(true)
    } else {
      hasMapViewportRef.current = true
    }

    setMapViewport(viewport)
  }, [])

  const handleSearchCurrentMapArea = () => {
    if (!mapViewport) {
      return
    }

    setMapViewportFilter(mapViewport.bounds)
    setHasPendingMapSearch(false)
    setVisibleListCount(PAGE_SIZE)
  }

  const closeFilterSheet = useCallback(() => {
    setIsFilterSheetOpen(false)
  }, [])

  const toggleMapQuickChip = useCallback((chipId: string) => {
    // Deferred facet filters: keep these chips as visual toggles until the backend API contract exists.
    setActiveMapQuickChips((previous) => ({
      ...previous,
      [chipId]: !previous[chipId],
    }))
  }, [])

  const shopsError = shopsQuery.isError ? (shopsQuery.error as Error).message : null
  const detailError = activeShopDetailQuery.isError ? (activeShopDetailQuery.error as Error).message : null
  const primaryLink = detailShop?.links[0] ?? null
  const detailFloorLabel = formatFloorLabel(detailShop?.floor ?? null)
  const detailDescriptionPreview = buildDescriptionPreview(detailShop?.description ?? detailShop?.visitTip ?? null, 104)
  const detailMediaTone = detailShop ? getDetailMediaTone(detailShop.id) : 'blue'
  const detailMediaItems = detailShop ? buildDetailMediaItems(detailShop, detailPhotosQuery.data ?? []) : []
  const detailHeroImage = detailMediaItems[0] ?? null
  const naverDirectionTarget = detailShop
    ? {
        latitude: detailShop.py,
        longitude: detailShop.px,
        name: detailShop.name,
      }
    : null
  const naverDirectionUrl = naverDirectionTarget && canBuildNaverWebDirectionUrl(naverDirectionTarget)
    ? buildNaverWebDirectionUrl(
        naverDirectionTarget,
        effectiveUserLocation ? { ...effectiveUserLocation, name: '현재 위치' } : null,
      )
    : null
  const naverSearchUrl = detailShop ? buildNaverMapSearchUrl(`${detailShop.name} ${detailShop.address}`) : null
  const detailActionLinkUrl = primaryLink?.url ?? naverSearchUrl
  const isListSheetOpen = viewMode === 'list' && !detailShop
  const assistantHasConversation = assistantMessages.some((message) => message.role === 'user')
  const showAssistantSuggestions = shouldShowAssistantSuggestions(assistantMessages)
  const showAssistantReturn = !assistantOpen && assistantHasConversation && !isListSheetOpen && sheetMode !== 'expanded'

  const handleListScroll = (event: UIEvent<HTMLDivElement>) => {
    const target = event.currentTarget
    listScrollTopRef.current = target.scrollTop
    listVisibleCountRef.current = visibleListCount
    const remain = target.scrollHeight - target.scrollTop - target.clientHeight

    if (remain > 120) {
      return
    }

    setVisibleListCount((current) => {
      if (current >= totalShops) {
        return current
      }

      const nextCount = Math.min(current + PAGE_SIZE, totalShops)
      listVisibleCountRef.current = nextCount
      return nextCount
    })
  }

  const handleDetailBodyScroll = (event: UIEvent<HTMLDivElement>) => {
    const nextCollapsed = event.currentTarget.scrollTop > 196
    setIsDetailHeaderCollapsed((current) => (current === nextCollapsed ? current : nextCollapsed))
  }

  const expandPeekSheet = () => {
    setIsDetailHeaderCollapsed(false)
    setPeekDragOffset(0)
    setIsPeekDragging(false)
    setAssistantOpen(false)
    setSheetMode('expanded')
  }

  const resetPeekDrag = () => {
    peekPointerIdRef.current = null
    peekDragStartYRef.current = null
    peekMovedRef.current = false
    setPeekDragOffset(0)
    setIsPeekDragging(false)
  }

  const handlePeekPointerDown = (event: React.PointerEvent<HTMLElement>) => {
    peekPointerIdRef.current = event.pointerId
    peekDragStartYRef.current = event.clientY
    peekMovedRef.current = false
    setIsPeekDragging(true)
    event.currentTarget.setPointerCapture?.(event.pointerId)
  }

  const handlePeekPointerMove = (event: React.PointerEvent<HTMLElement>) => {
    if (peekPointerIdRef.current !== event.pointerId || peekDragStartYRef.current == null) {
      return
    }

    const deltaY = event.clientY - peekDragStartYRef.current
    const nextOffset = Math.min(0, Math.max(deltaY, -96))

    if (Math.abs(deltaY) > 6) {
      peekMovedRef.current = true
    }

    setPeekDragOffset(nextOffset)
  }

  const handlePeekPointerEnd = (event: React.PointerEvent<HTMLElement>) => {
    if (peekPointerIdRef.current !== event.pointerId || peekDragStartYRef.current == null) {
      return
    }

    const deltaY = event.clientY - peekDragStartYRef.current
    event.currentTarget.releasePointerCapture?.(event.pointerId)

    if (deltaY <= -36) {
      resetPeekDrag()
      expandPeekSheet()
      return
    }

    resetPeekDrag()
  }

  const handlePeekPointerCancel = () => {
    resetPeekDrag()
  }

  const handlePeekClick = () => {
    if (peekMovedRef.current) {
      peekMovedRef.current = false
      return
    }

    expandPeekSheet()
  }

  useLayoutEffect(() => {
    if (!isListSheetOpen || !pendingListRestoreRef.current || !listScrollRef.current) {
      return
    }

    listScrollRef.current.scrollTop = listScrollTopRef.current
    pendingListRestoreRef.current = false
  }, [isListSheetOpen, visibleListCount])

  useLayoutEffect(() => {
    if (sheetMode !== 'expanded' || !detailScrollRef.current) {
      return
    }

    detailScrollRef.current.scrollTop = 0
  }, [detailShop?.id, sheetMode])

  useLayoutEffect(() => {
    if (!assistantOpen || !assistantMessagesRef.current) {
      return
    }

    const container = assistantMessagesRef.current
    container.scrollTop = container.scrollHeight
  }, [assistantMessages, assistantOpen, assistantMutation.isPending])

  const handleMapSelectShop = (shopId: number) => {
    handleSelectShop(shopId, 'map')
  }

  const handleListSelectShop = (shopId: number) => {
    listScrollTopRef.current = listScrollRef.current?.scrollTop ?? 0
    listVisibleCountRef.current = visibleListCount
    handleSelectShop(shopId, 'list', 'expanded')
  }

  const handleExpandedBack = () => {
    if (selectionOrigin === 'list') {
      restoreListView()
      return
    }

    setSheetMode('peek')
  }

  const openNaverDirections = (event?: { stopPropagation: () => void }) => {
    event?.stopPropagation()

    if (naverDirectionUrl) {
      window.open(naverDirectionUrl, '_blank', 'noopener,noreferrer')
      return
    }

    if (naverSearchUrl) {
      window.open(naverSearchUrl, '_blank', 'noopener,noreferrer')
    }
  }

  const handleShareShop = async () => {
    if (!detailShop) {
      return
    }

    setShareFeedback(null)

    const shareData = {
      title: detailShop.name,
      text: `${detailShop.name} - ${detailShop.address}`,
      url: window.location.href,
    }

    if (navigator.share) {
      try {
        await navigator.share(shareData)
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') {
          return
        }

        setShareFeedback('공유를 완료하지 못했습니다. 잠시 후 다시 시도해 주세요.')
      }

      return
    }

    try {
      if (!navigator.clipboard?.writeText) {
        setShareFeedback('이 환경에서는 공유 링크를 복사할 수 없습니다.')
        return
      }

      await navigator.clipboard.writeText(shareData.url)
      setShareFeedback('공유 링크를 복사했습니다.')
    } catch {
      setShareFeedback('공유 링크를 복사하지 못했습니다.')
    }
  }

  return (
    <main className="map-page-shell">
      <section className="map-page">
        <div
          className={[
            'map-surface',
            'map-surface-app',
            'map-surface-app-v2',
            !usesTossNavigation ? 'map-surface-local-navigation' : '',
            detailShop ? 'map-surface-sheet-open' : '',
            sheetMode === 'expanded' ? 'map-surface-sheet-expanded' : '',
            isListSheetOpen ? 'map-surface-list-open' : '',
          ]
            .filter(Boolean)
            .join(' ')}
        >
          <AitNavigation className="map-route-navigation" showBack onBack={() => navigate('/home')} />

          {shopsQuery.isLoading && allShops.length === 0 ? (
            <div className="map-empty">
              <p>매장 지도를 준비하고 있습니다.</p>
            </div>
          ) : (
            <ShopMap
              shops={mappableShops}
              activeShopId={detailShop?.id ?? null}
              onSelectShop={handleMapSelectShop}
              onClearSelection={handleClearSelection}
              onViewportChange={handleMapViewportChange}
              userLocation={effectiveUserLocation}
              focusMode={focusMode}
              focusRequestId={focusRequestId}
              selectionOrigin={selectionOrigin}
            />
          )}

          <div
            className={`map-explore-top ${sheetMode === 'expanded' || isListSheetOpen ? 'map-explore-top-hidden' : ''}`}
          >
            <ExploreTopSearch
              attachTriggerRef={!isListSheetOpen}
              filterTriggerRef={filterTriggerRef}
              isFilterSheetOpen={isFilterSheetOpen}
              appliedFilterCount={appliedFilterCount}
              onSearchClick={() => navigate('/search')}
              onFilterClick={() => setIsFilterSheetOpen(true)}
            />
            <MapQuickChips items={MAP_QUICK_CHIPS} activeItems={activeMapQuickChips} onToggle={toggleMapQuickChip} />

            {hasPendingMapSearch && mapViewport ? (
              <button className="map-area-search-button" type="button" onClick={handleSearchCurrentMapArea}>
                <svg className="map-area-search-icon" aria-hidden="true" fill="none" viewBox="0 0 24 24">
                  <path d="M20 11a8 8 0 0 0-14.6-4.5L4 8" />
                  <path d="M4 4v4h4" />
                  <path d="M4 13a8 8 0 0 0 14.6 4.5L20 16" />
                  <path d="M20 20v-4h-4" />
                </svg>
                이 지역 매장 검색
              </button>
            ) : null}

            {locationError ? <p className="error-text map-inline-error map-inline-error-overlay">{locationError}</p> : null}
            {shopsError ? <p className="error-text map-inline-error map-inline-error-overlay">{shopsError}</p> : null}
          </div>

          <SearchFilterSheet open={isFilterSheetOpen} triggerRef={filterTriggerRef} onClose={closeFilterSheet} />

          <MapOverlayControls
            visible={sheetMode !== 'expanded'}
            isListSheetOpen={isListSheetOpen}
            locationState={locationState}
            onListClick={handleListFabClick}
            onLocationClick={handleRequestLocation}
          />

          <MapAssistantPanel
            visible={!isListSheetOpen && sheetMode !== 'expanded'}
            open={assistantOpen}
            showReturn={showAssistantReturn}
            hasConversation={assistantHasConversation}
            showSuggestions={showAssistantSuggestions}
            messages={assistantMessages}
            messagesRef={assistantMessagesRef}
            suggestions={ASSISTANT_SUGGESTIONS}
            input={assistantInput}
            isPending={assistantMutation.isPending}
            shops={shopsWithDistance}
            onToggle={() => setAssistantOpen((current) => !current)}
            onOpen={() => setAssistantOpen(true)}
            onClose={() => setAssistantOpen(false)}
            onInputChange={setAssistantInput}
            onSubmitQuestion={submitAssistantQuestion}
            onSelectRecommendation={(shopId) => handleSelectShop(shopId, 'map')}
          />

          <MapResultsSheet
            visible={isListSheetOpen}
            topSearch={
              <ExploreTopSearch
                attachTriggerRef={isListSheetOpen}
                filterTriggerRef={filterTriggerRef}
                isFilterSheetOpen={isFilterSheetOpen}
                appliedFilterCount={appliedFilterCount}
                onSearchClick={() => navigate('/search')}
                onFilterClick={() => setIsFilterSheetOpen(true)}
              />
            }
            visibleShops={visibleShops}
            totalShops={totalShops}
            isLoading={shopsQuery.isLoading}
            listRef={listScrollRef}
            onScroll={handleListScroll}
            onSelectShop={handleListSelectShop}
          />

          <MapPeekSheet
            shop={sheetMode === 'peek' ? detailShop : null}
            distanceLabel={activeShop?.distanceLabel ?? null}
            heroImage={detailHeroImage}
            isDragging={isPeekDragging}
            dragOffset={peekDragOffset}
            selectionOrigin={selectionOrigin}
            onClick={handlePeekClick}
            onOpenDirections={openNaverDirections}
            onPointerCancel={handlePeekPointerCancel}
            onPointerDown={handlePeekPointerDown}
            onPointerMove={handlePeekPointerMove}
            onPointerUp={handlePeekPointerEnd}
          />

          {detailShop && sheetMode === 'expanded' ? (
            <section
              className="map-bottom-sheet map-bottom-sheet-expanded"
              id="map-place-detail"
              aria-label={`${detailShop.name} 상세 정보`}
            >
              <div className="map-sheet-expanded-body" onScroll={handleDetailBodyScroll} ref={detailScrollRef}>
                <div
                  className={[
                    'map-sheet-sticky-header',
                    isDetailHeaderCollapsed ? 'map-sheet-sticky-header-visible' : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                >
                  <div className="map-sheet-sticky-actions">
                    <button className="map-sheet-icon-button" type="button" onClick={handleExpandedBack} aria-label="뒤로 가기">
                      ←
                    </button>
                    <GlobalNavigationMenu triggerClassName="global-nav-trigger global-nav-trigger-overlay" />
                  </div>
                  <strong>{detailShop.name}</strong>
                  <button className="map-sheet-icon-button" type="button" onClick={handleClearSelection} aria-label="상세 화면 닫기">
                    ×
                  </button>
                </div>

                <MapDetailMediaSection
                  shop={detailShop}
                  tone={detailMediaTone}
                  detailMediaItems={detailMediaItems}
                  onBack={handleExpandedBack}
                  onClose={handleClearSelection}
                />

                <div className="map-sheet-shell map-sheet-shell-detail">
                  {detailError ? <p className="section error-text">{detailError}</p> : null}

                  <MapDetailSummaryCard
                    shop={detailShop}
                    primaryLinkUrl={primaryLink?.url ?? null}
                    actionLinkUrl={detailActionLinkUrl}
                    descriptionPreview={detailDescriptionPreview}
                    shareFeedback={shareFeedback}
                    onShareShop={handleShareShop}
                    onOpenDirections={openNaverDirections}
                  />

                  <MapDetailInfoCard
                    shop={detailShop}
                    floorLabel={detailFloorLabel}
                    distanceLabel={activeShop?.distanceLabel ?? null}
                    onOpenDirections={openNaverDirections}
                  />

                  <MapDetailSupplementSections
                    shop={detailShop}
                    relatedShops={relatedShops}
                    onSelectRelatedShop={(shopId) => handleSelectShop(shopId, selectionOrigin ?? 'map', 'expanded')}
                  />
                </div>
              </div>
            </section>
          ) : null}
        </div>
      </section>
    </main>
  )
}
