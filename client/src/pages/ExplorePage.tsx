import { type ReactNode, type UIEvent, useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { getShopPhotos } from '../shared/api/admin'
import { askMapAssistant } from '../shared/api/llm'
import { getShop, getShops } from '../shared/api/shops'
import type { AdminShopPhoto, MapAssistantRecommendation, Shop } from '../shared/api/types'
import { formatRelativeUpdated, linkTypeToLabel, statusToLabel } from '../shared/lib/format'
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
import { GlobalNavigationMenu } from '../shared/ui/GlobalNavigationMenu'
import { SearchFilterSheet } from '../shared/ui/SearchFilterSheet'
import { type MapViewport, ShopMap } from '../shared/ui/ShopMap'
import { MapAssistantIcon, MapDetailIcon, type MapDetailIconName } from '../shared/ui/mapDetailIcons'
import { StatusPill } from '../shared/ui/StatusPill'
import { readNearbyExploreParams } from './searchNearby'

const PAGE_SIZE = 10
const MAP_FETCH_SIZE = 200
const EMPTY_SHOPS: Shop[] = []
const DETAIL_MEDIA_TONES = ['blue', 'orange', 'mint', 'violet'] as const
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

type AssistantMessage = {
  id: string
  role: 'assistant' | 'user'
  content: string
  recommendations?: MapAssistantRecommendation[]
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

function shouldShowAssistantSuggestions(messages: AssistantMessage[]) {
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
  if (uploadedPhotos.length > 0) {
    return uploadedPhotos.slice(0, 5).map((photo, index) => ({
      id: photo.id,
      src: photo.dataUrl,
      alt: `${shop.name} 실제 사진 ${index + 1}`,
    }))
  }

  const seeds = ['hero', 'sub-1', 'sub-2', 'sub-3', 'sub-4']

  return seeds.map((seed, index) => {
    const size = index === 0 ? 960 : 480
    const encodedSeed = encodeURIComponent(`aniwhere-${shop.id}-${shop.name}-${seed}`)

    return {
      id: `${shop.id}-${seed}`,
      src: `https://picsum.photos/seed/${encodedSeed}/${size}/${size}`,
      alt: `${shop.name} 미디어 ${index + 1}`,
    }
  })
}

function isShopInsideMapBounds(shop: Shop, bounds: MapBounds) {
  const isInsideLatitude = shop.py >= bounds.southWest.latitude && shop.py <= bounds.northEast.latitude
  const isInsideLongitude =
    bounds.southWest.longitude <= bounds.northEast.longitude
      ? shop.px >= bounds.southWest.longitude && shop.px <= bounds.northEast.longitude
      : shop.px >= bounds.southWest.longitude || shop.px <= bounds.northEast.longitude

  return isInsideLatitude && isInsideLongitude
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
  const [assistantMessages, setAssistantMessages] = useState<AssistantMessage[]>([
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
  const mapQuickChips = [
    { id: 'favorite', label: '관심매장' },
    { id: 'active', label: '영업중' },
  ]

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

  const renderTopSearch = (attachTriggerRef: boolean) => (
    <div className="map-search-row search-screen-toolrow">
      <button className="search-screen-bar map-search-field" type="button" onClick={() => navigate('/search')}>
        <span className="map-search-field-copy">매장, 작품, 지역 검색</span>
        <svg aria-hidden="true" fill="none" viewBox="0 0 24 24">
          <circle cx="11" cy="11" r="6" />
          <path d="m16 16 4 4" />
        </svg>
      </button>
      <button
        className="search-filter-button map-filter-button"
        type="button"
        ref={attachTriggerRef ? filterTriggerRef : null}
        onClick={() => setIsFilterSheetOpen(true)}
        aria-controls="search-filter-sheet"
        aria-expanded={isFilterSheetOpen}
        aria-label={appliedFilterCount > 0 ? `필터 ${appliedFilterCount}개 적용됨` : '필터 열기'}
      >
        <svg aria-hidden="true" fill="none" viewBox="0 0 24 24">
          <path d="M4 7h10" />
          <path d="M18 7h2" />
          <path d="M4 17h2" />
          <path d="M10 17h10" />
          <circle cx="16" cy="7" r="2" />
          <circle cx="8" cy="17" r="2" />
        </svg>
        {appliedFilterCount > 0 ? <small>{appliedFilterCount}</small> : null}
      </button>
    </div>
  )

  const chipToolbar = (
    <div className="map-chip-toolbar">
      <ul className="map-chip-scroll" aria-label="빠른 필터">
        {mapQuickChips.map((item) => {
          const isMapQuickChipActive = Boolean(activeMapQuickChips[item.id])

          return (
            <li key={item.id}>
              <button
                className={`map-chip-status${isMapQuickChipActive ? ' map-chip-status-active' : ''}`}
                type="button"
                onClick={() => toggleMapQuickChip(item.id)}
                aria-pressed={isMapQuickChipActive}
                aria-label={`${item.label} ${isMapQuickChipActive ? '선택됨' : '선택 안 됨'}`}
              >
                {item.label}
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )

  return (
    <main className="map-page-shell">
      <section className="map-page">
        <div
          className={[
            'map-surface',
            'map-surface-app',
            'map-surface-app-v2',
            detailShop ? 'map-surface-sheet-open' : '',
            sheetMode === 'expanded' ? 'map-surface-sheet-expanded' : '',
            isListSheetOpen ? 'map-surface-list-open' : '',
          ]
            .filter(Boolean)
            .join(' ')}
        >
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
            {renderTopSearch(!isListSheetOpen)}
            {chipToolbar}

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

          {sheetMode !== 'expanded' ? (
            <button
              aria-label={isListSheetOpen ? '지도 보기' : '목록 보기'}
              className={`map-list-fab ${isListSheetOpen ? 'map-list-fab-map' : ''}`}
              type="button"
              onClick={handleListFabClick}
            >
              <span className="map-list-fab-icon" aria-hidden="true">
                {isListSheetOpen ? (
                  <svg className="map-list-fab-map-icon map-control-icon" aria-hidden="true" viewBox="0 0 24 24" fill="none">
                    <path d="m4 5 5-2 6 2 5-2v16l-5 2-6-2-5 2V5Z" />
                    <path d="M9 3v16" />
                    <path d="M15 5v16" />
                  </svg>
                ) : (
                  <svg className="map-list-fab-list-icon map-control-icon" aria-hidden="true" viewBox="0 0 24 24" fill="none">
                    <path d="M9 7h10" />
                    <path d="M9 12h10" />
                    <path d="M9 17h10" />
                    <circle cx="5.25" cy="7" r="1.1" />
                    <circle cx="5.25" cy="12" r="1.1" />
                    <circle cx="5.25" cy="17" r="1.1" />
                  </svg>
                )}
              </span>
            </button>
          ) : null}

          {!isListSheetOpen && sheetMode !== 'expanded' ? (
            <button
              className={`map-location-fab ${locationState === 'ready' ? 'map-location-fab-active' : ''}`}
              type="button"
              onClick={handleRequestLocation}
              aria-label="현재 위치 보기"
            >
              {locationState === 'loading' ? (
                <span className="map-chip-gps-spinner map-control-icon" aria-hidden="true" />
              ) : (
                <span className="map-chip-gps-icon map-control-icon" aria-hidden="true">
                  <span className="map-chip-gps-crosshair" />
                </span>
              )}
            </button>
          ) : null}

          {!isListSheetOpen && sheetMode !== 'expanded' ? (
            <>
              <button
                aria-expanded={assistantOpen}
                aria-label="AI 탐색 열기"
                className="map-llm-fab"
                type="button"
                onClick={() => setAssistantOpen((current) => !current)}
              >
                <MapAssistantIcon />
              </button>

              {showAssistantReturn ? (
                <button
                  className="map-llm-return"
                  type="button"
                  onClick={() => setAssistantOpen(true)}
                >
                  AI로 돌아가기
                </button>
              ) : null}

              {assistantOpen ? (
                <aside className="map-llm-panel" aria-label="AI 탐색 대화창">
                  <div className="map-llm-panel-head">
                    <strong>AI 챗봇</strong>
                    <button className="map-llm-close" type="button" onClick={() => setAssistantOpen(false)}>
                      ×
                    </button>
                  </div>

                  {!assistantHasConversation ? (
                    <div className="map-llm-start-screen">
                      <div className="map-llm-start-copy">
                        <span className="map-llm-start-badge">
                          <MapAssistantIcon />
                          AI 탐색
                        </span>
                        <strong>궁금한 것이 있으신가요?</strong>
                        <p>AI에게 질문해 보세요.</p>
                      </div>

                      <div className="map-llm-start-list">
                        {ASSISTANT_SUGGESTIONS.map((suggestion, index) => (
                          <button
                            className="map-llm-start-card"
                            key={suggestion}
                            type="button"
                            onClick={() => submitAssistantQuestion(suggestion)}
                          >
                            <span>{index === 0 ? '추천 질문' : index === 1 ? '많이 찾는 질문' : '처음 시작 질문'}</span>
                            <strong>{suggestion}</strong>
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="map-llm-message-list" ref={assistantMessagesRef}>
                      {assistantMessages.map((message) => (
                        <article
                          className={`map-llm-message map-llm-message-${message.role}`}
                          key={message.id}
                        >
                          <p>{message.content}</p>
                          {message.recommendations && message.recommendations.length > 0 ? (
                            <div className="map-llm-recommend-list">
                              {message.recommendations.map((recommendation) => {
                                const recommendedShop = shopsWithDistance.find((shop) => shop.id === recommendation.shopId)

                                if (!recommendedShop) {
                                  return null
                                }

                                return (
                                  <button
                                    className="map-llm-recommend-card"
                                    key={`${message.id}-${recommendation.shopId}`}
                                    type="button"
                                    onClick={() => {
                                      handleSelectShop(recommendedShop.id, 'map')
                                    }}
                                  >
                                    <strong>{recommendedShop.name}</strong>
                                    <span>{recommendation.reason}</span>
                                  </button>
                                )
                              })}
                            </div>
                          ) : null}
                        </article>
                      ))}

                      {assistantMutation.isPending ? (
                        <article className="map-llm-message map-llm-message-assistant">
                          <p>조건에 맞는 매장을 정리하는 중입니다...</p>
                        </article>
                      ) : null}

                      {showAssistantSuggestions ? (
                        <article className="map-llm-message map-llm-message-suggestion">
                          <strong>이런 질문으로 다시 이어가보세요</strong>
                          <div className="map-llm-suggestion-row">
                            {ASSISTANT_SUGGESTIONS.map((suggestion) => (
                              <button
                                className="map-llm-suggestion"
                                key={suggestion}
                                type="button"
                                onClick={() => submitAssistantQuestion(suggestion)}
                              >
                                {suggestion}
                              </button>
                            ))}
                          </div>
                        </article>
                      ) : null}
                    </div>
                  )}

                  <form
                    className="map-llm-input-row"
                    onSubmit={(event) => {
                      event.preventDefault()
                      submitAssistantQuestion(assistantInput)
                    }}
                  >
                    <input
                      className="map-llm-input"
                      placeholder="작품명, 지역, 운영 상태를 물어보세요"
                      value={assistantInput}
                      onChange={(event) => setAssistantInput(event.target.value)}
                    />
                    <button className="map-llm-send" type="submit">
                      전송
                    </button>
                  </form>
                </aside>
              ) : null}
            </>
          ) : null}

          {isListSheetOpen ? (
            <section className="map-results-sheet-v2" aria-label="검색 결과 목록">
              <div className="map-results-sheet-top">
                {renderTopSearch(isListSheetOpen)}
              </div>

              {visibleShops.length === 0 && !shopsQuery.isLoading ? (
                <div className="map-list-empty">
                  <strong>조건에 맞는 매장이 없습니다.</strong>
                  <p>다른 키워드나 태그로 다시 탐색해보세요.</p>
                </div>
              ) : null}

              <div className="map-results-sheet-list" onScroll={handleListScroll} ref={listScrollRef}>
                {visibleShops.map((shop) => (
                  <button
                    className="map-results-card"
                    key={shop.id}
                    type="button"
                    onClick={() => handleListSelectShop(shop.id)}
                  >
                    <div className="map-list-item-head">
                      <strong>{shop.name}</strong>
                      <StatusPill status={shop.status} />
                    </div>
                    <p>
                      {shop.regionName ?? `지역 ${shop.regionId ?? '-'}`} · 작품 {shop.works.length}
                      {shop.distanceLabel ? ` · ${shop.distanceLabel}` : ''}
                    </p>
                    <p className="map-list-item-subtle">{shop.address}</p>
                    <p className="map-list-item-subtle">{formatRelativeUpdated(shop.updatedAt)}</p>
                  </button>
                ))}

                {visibleShops.length < totalShops ? (
                  <div className="map-results-sheet-loading">
                    <span>{visibleShops.length} / {totalShops}</span>
                    <p>아래로 내리면 다음 매장을 이어서 불러옵니다.</p>
                  </div>
                ) : null}
              </div>
            </section>
          ) : null}

          {detailShop && sheetMode === 'peek' ? (
            <section
              className={[
                'map-bottom-sheet',
                'map-bottom-sheet-peek',
                isPeekDragging ? 'map-bottom-sheet-peek-dragging' : '',
                selectionOrigin === 'list' ? 'map-bottom-sheet-peek-static' : '',
              ]
                .filter(Boolean)
                .join(' ')}
              aria-label={`${detailShop.name} 요약 정보`}
              onClick={handlePeekClick}
              onPointerCancel={handlePeekPointerCancel}
              onPointerDown={handlePeekPointerDown}
              onPointerMove={handlePeekPointerMove}
              onPointerUp={handlePeekPointerEnd}
              style={{
                transform: peekDragOffset !== 0 ? `translateY(${peekDragOffset}px)` : undefined,
              }}
            >
              <div className="map-sheet-peek-trigger" aria-hidden="true">
                <span className="map-bottom-sheet-handle" />
              </div>

              <div className="map-sheet-peek-summary">
                <div className="map-sheet-peek-copy">
                  <div className="map-sheet-peek-head">
                    <strong>{detailShop.name}</strong>
                    <StatusPill status={detailShop.status} />
                  </div>
                  <p>
                    {detailShop.regionName ?? `지역 ${detailShop.regionId ?? '-'}`}
                    {activeShop?.distanceLabel ? ` · ${activeShop.distanceLabel}` : ''}
                  </p>
                  <p className="map-sheet-peek-meta">{detailShop.address}</p>
                </div>
                <button
                  className="map-sheet-peek-route"
                  type="button"
                  onClick={openNaverDirections}
                  aria-label={`${detailShop.name} 네이버 지도 웹 길찾기 열기`}
                >
                  {detailHeroImage ? (
                    <img src={detailHeroImage.src} alt="" aria-hidden="true" />
                  ) : (
                    <span aria-hidden="true">{detailShop.name.slice(0, 1)}</span>
                  )}
                  <strong aria-hidden="true">↱</strong>
                </button>
              </div>
            </section>
          ) : null}

          {detailShop && sheetMode === 'expanded' ? (
            <section className="map-bottom-sheet map-bottom-sheet-expanded" aria-label={`${detailShop.name} 상세 정보`}>
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

                <section className={`map-sheet-media map-sheet-media-${detailMediaTone}`}>
                  <div className="map-sheet-media-topbar">
                    <div className="map-sheet-topbar-actions">
                      <button
                        className="map-sheet-icon-button map-sheet-icon-button-overlay"
                        type="button"
                        onClick={handleExpandedBack}
                        aria-label="뒤로 가기"
                      >
                        ←
                      </button>
                      <GlobalNavigationMenu triggerClassName="global-nav-trigger global-nav-trigger-overlay" />
                    </div>
                    <div className="map-sheet-topbar-actions">
                      <button
                        className="map-sheet-icon-button map-sheet-icon-button-overlay"
                        type="button"
                        onClick={handleClearSelection}
                        aria-label="상세 화면 닫기"
                      >
                        ×
                      </button>
                    </div>
                  </div>

                  <div className="map-sheet-media-grid">
                    {detailMediaItems[0] ? (
                      <article className="map-sheet-media-main">
                        <img className="map-sheet-media-image" src={detailMediaItems[0].src} alt={detailMediaItems[0].alt} />
                        <div className="map-sheet-media-image-overlay">
                          <span className="map-sheet-media-badge">{detailShop.regionName ?? 'ANIWHERE'}</span>
                          <strong>{detailShop.categories[0] ?? detailShop.works[0] ?? '매장 큐레이션'}</strong>
                        </div>
                      </article>
                    ) : null}

                    <div className="map-sheet-media-stack">
                      {detailMediaItems.slice(1).map((item, index) => (
                        <article className="map-sheet-media-tile" key={item.id}>
                          <img className="map-sheet-media-image" src={item.src} alt={item.alt} />
                          {index === detailMediaItems.slice(1).length - 1 ? (
                            <div className="map-sheet-media-count">
                              <strong>+{Math.max(detailMediaItems.length, detailShop.links.length, detailShop.works.length, 4)}</strong>
                            </div>
                          ) : null}
                        </article>
                      ))}
                    </div>
                  </div>
                </section>

                <div className="map-sheet-shell map-sheet-shell-detail">
                  {detailError ? <p className="section error-text">{detailError}</p> : null}

                  <section className="section map-sheet-summary-card map-sheet-summary-card-compact" id="map-place-home">
                    <div className="map-sheet-summary-head map-sheet-summary-head-compact">
                      <div className="map-sheet-summary-copy">
                        <span className="eyebrow">{detailShop.regionName ?? `지역 ${detailShop.regionId ?? '-'}`}</span>
                        <h1>{detailShop.name}</h1>
                        <p>
                          {detailShop.categories.length > 0
                            ? detailShop.categories.join(' · ')
                            : detailShop.works.length > 0
                              ? detailShop.works.slice(0, 2).join(' · ')
                              : '카테고리 확인 중'}
                        </p>
                      </div>
                      <StatusPill status={detailShop.status} />
                    </div>

                    <div className="map-sheet-primary-actions">
                      {primaryLink ? (
                        <a className="map-sheet-primary-button map-sheet-primary-button-fill" href={primaryLink.url} rel="noreferrer" target="_blank">
                          <MapDetailIcon name="link" />
                          <span>공식 링크</span>
                        </a>
                      ) : null}
                      <Link className="map-sheet-primary-button" to="/community">
                        <MapDetailIcon name="tag" />
                        <span>후기 보기</span>
                      </Link>
                    </div>

                    <div className="map-place-action-grid" aria-label="매장 주요 액션">
                      {detailActionLinkUrl ? (
                        <a
                          className="map-place-action"
                          href={detailActionLinkUrl}
                          rel="noreferrer"
                          target="_blank"
                        >
                          <MapDetailIcon name="link" />
                          <span>전화/링크</span>
                        </a>
                      ) : (
                        <button className="map-place-action" type="button" disabled aria-disabled="true">
                          <MapDetailIcon name="link" />
                          <span>전화/링크</span>
                        </button>
                      )}
                      <button className="map-place-action" type="button" onClick={handleShareShop}>
                        <MapDetailIcon name="tag" />
                        <span>공유</span>
                      </button>
                      <button className="map-place-action map-place-action-primary" type="button" onClick={openNaverDirections}>
                        <MapDetailIcon name="pin" />
                        <span>경로 확인</span>
                      </button>
                      <Link className="map-place-action" to={`/community?shopId=${detailShop.id}`}>
                        <MapDetailIcon name="clock" />
                        <span>리뷰</span>
                      </Link>
                    </div>
                    {shareFeedback ? (
                      <p className="map-place-feedback" role="status" aria-live="polite">
                        {shareFeedback}
                      </p>
                    ) : null}

                    <nav className="map-place-tabs" aria-label="상세 정보 바로가기">
                      <a href="#map-place-home">홈</a>
                      <a href="#map-place-review">리뷰</a>
                      <a href="#map-place-info">지도</a>
                      <a href="#map-place-info">정보</a>
                    </nav>

                    {detailDescriptionPreview ? (
                      <div className="map-sheet-ai-summary">
                        <div className="map-sheet-ai-summary-head">
                          <strong>AI 요약 정보</strong>
                          <span>수집 링크 기반</span>
                        </div>
                        <p>{detailDescriptionPreview}</p>
                      </div>
                    ) : null}
                  </section>

                  <section className="section map-sheet-info-card map-sheet-info-list-v2 map-sheet-info-list-v3" id="map-place-info">
                    <MapDetailRow icon="pin" label="주소">
                      <button className="map-place-address-button" type="button" onClick={openNaverDirections}>
                        {detailShop.address}
                        <span>네이버 지도 웹</span>
                      </button>
                    </MapDetailRow>
                    <MapDetailRow icon="layers" label="운영 정보">
                      {detailFloorLabel ?? '층 정보 확인 필요'} · {statusToLabel(detailShop.status)}
                      {detailShop.sellsIchibanKuji ? ' · 일번쿠지 취급' : ''}
                    </MapDetailRow>
                    <MapDetailRow icon="tag" label="취급 / 분류">
                      {detailShop.works.length > 0
                        ? `${detailShop.works.slice(0, 4).join(' · ')}${detailShop.works.length > 4 ? ` 외 ${detailShop.works.length - 4}개` : ''}`
                        : detailShop.categories.length > 0
                          ? detailShop.categories.join(' · ')
                          : '등록된 작품 정보 없음'}
                    </MapDetailRow>
                    {detailShop.visitTip ? (
                      <MapDetailRow icon="tag" label="방문 팁">
                        {detailShop.visitTip}
                      </MapDetailRow>
                    ) : null}
                    <MapDetailRow icon="clock" label="업데이트">
                      {formatRelativeUpdated(detailShop.updatedAt)}
                      {activeShop?.distanceLabel ? ` · ${activeShop.distanceLabel}` : ''}
                    </MapDetailRow>
                  </section>

                  <section className="section map-place-review-card" id="map-place-review">
                    <div className="map-place-review-copy">
                      <strong>{detailShop.name}</strong>
                      <span>다녀오셨나요?</span>
                      <p>방문 팁과 굿즈 정보를 리뷰로 남겨주세요.</p>
                    </div>
                    <Link className="map-place-review-button" to={`/community?shopId=${detailShop.id}`}>
                      ✎ 리뷰 쓰기
                    </Link>
                  </section>

                  {detailShop.works.length > 0 ? (
                    <section className="section map-sheet-list-card">
                      <div className="map-sheet-section-head">
                        <strong>취급 작품</strong>
                        <span>{detailShop.works.length}개</span>
                      </div>
                      <div className="map-sheet-token-cloud">
                        {detailShop.works.slice(0, 8).map((work) => (
                          <span className="map-sheet-token-chip" key={work}>
                            {work}
                          </span>
                        ))}
                      </div>
                      {detailShop.works.length > 8 ? (
                        <p className="map-sheet-footnote">외 {detailShop.works.length - 8}개</p>
                      ) : null}
                    </section>
                  ) : null}

                  {detailShop.links.length > 0 ? (
                    <section className="section map-sheet-link-section-v2">
                      <div className="map-sheet-section-head">
                        <strong>공식 / 외부 링크</strong>
                        <span>{detailShop.links.length}개</span>
                      </div>
                      <div className="map-sheet-link-list">
                        {detailShop.links.map((item) => (
                          <a className="map-sheet-link-row" href={item.url} key={item.id} rel="noreferrer" target="_blank">
                            <span className="map-sheet-link-icon">
                              <MapDetailIcon name="link" />
                            </span>
                            <div className="map-sheet-link-copy">
                              <strong>{linkTypeToLabel(item.type)}</strong>
                              <p>{item.url}</p>
                            </div>
                          </a>
                        ))}
                      </div>
                    </section>
                  ) : null}

                  {relatedShops.length > 0 ? (
                    <section className="section map-sheet-section map-sheet-recommend-section">
                      <div className="map-sheet-section-head">
                        <strong>함께 보면 좋은 장소</strong>
                        <span>{relatedShops.length}곳</span>
                      </div>

                      <div className="map-related-rail">
                        {relatedShops.map((shop) => (
                            <button
                              className="map-related-card"
                              key={shop.id}
                              type="button"
                              onClick={() => handleSelectShop(shop.id, selectionOrigin ?? 'map', 'expanded')}
                            >
                            <div className="map-related-card-visual">
                              <span>{shop.categories[0] ?? 'SHOP'}</span>
                            </div>
                            <div className="map-related-card-copy">
                              <strong>{shop.name}</strong>
                              <p>{shop.regionName ?? `지역 ${shop.regionId ?? '-'}`}</p>
                            </div>
                          </button>
                        ))}
                      </div>
                    </section>
                  ) : null}
                </div>
              </div>
            </section>
          ) : null}
        </div>
      </section>
    </main>
  )
}





