import { type UIEvent, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { keepPreviousData, useMutation, useQuery } from '@tanstack/react-query'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { getShopPhotos } from '../shared/api/admin'
import { askMapAssistant } from '../shared/api/llm'
import { addFavoriteShop, getNearbyShops, getShop, getShopFacets, getShops, removeFavoriteShop } from '../shared/api/shops'
import { listMyFavoriteShops } from '../shared/api/users'
import type { AdminShopPhoto, Shop } from '../shared/api/types'
import {
  calculateDistanceKm,
  formatDistanceLabel,
  requestCurrentLocation,
  type UserLocation,
} from '../shared/lib/location'
import {
  countShopFilters,
  parseShopFilters,
  removeAppliedShopFilterChip,
  toShopSearchParams,
  writeShopFilters,
  type AppliedShopFilterChip,
  type ShopFilters,
} from '../shared/lib/shopFilters'
import {
  SHOP_FACET_GC_TIME_MS,
  SHOP_FACET_STALE_TIME_MS,
  shopFacetQueryKey,
} from '../shared/lib/shopFacetQuery'
import {
  buildNaverMapSearchUrl,
  buildNaverWebDirectionUrl,
  canBuildNaverWebDirectionUrl,
} from '../shared/lib/naverDirections'
import { isAppsInTossRuntime } from '../shared/lib/auth'
import { getStoredAccessToken } from '../shared/lib/authSession'
import { AppliedFilterChips } from '../shared/ui/AppliedFilterChips'
import { SearchFilterSheet } from '../shared/ui/SearchFilterSheet'
import { AppTopNavigation } from '../shared/ui/AppTopNavigation'
import { type MapViewport, ShopMap } from '../shared/ui/ShopMap'
import { Toast } from '@aniwhere/tds-mobile'
import { MapAssistantPanel, type MapAssistantMessage } from './explore/MapAssistantPanel'
import { MapDetailInfoCard } from './explore/MapDetailInfoCard'
import { MapDetailMediaSection } from './explore/MapDetailMediaSection'
import { MapDetailSummaryCard, type MapDetailTab } from './explore/MapDetailSummaryCard'
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
  { id: 'hours', label: '영업중', icon: 'time', ariaLabel: '영업중 필터', hidden: true },
  { id: 'favorite', label: '관심매장', icon: 'star' },
]
const isMapAssistantEnabled = false
const ASSISTANT_SUGGESTIONS = ['홍대에서 피규어 많은 곳', '피규어 종류가 많은 매장', '초행자에게 추천할 만한 곳']
const ASSISTANT_RETRY_HINT = '현재 데이터 기준으로 바로 맞는 후보를 찾지 못했어요. 작품명, 지역명, 매장명을 조금 더 구체적으로 입력해보세요.'

type FocusMode = 'shops' | 'shop' | 'user' | 'idle'
type ViewMode = 'map' | 'list'
type SheetMode = 'peek' | 'expanded'
type SelectionOrigin = 'map' | 'list' | null
type ExploreLocationState = {
  returnTo?: string
} | null
type DetailMediaTone = (typeof DETAIL_MEDIA_TONES)[number]
type DetailMediaItem = {
  id: string
  src: string
  alt: string
}

function getLocationErrorMessage(error: unknown) {
  const message = error instanceof Error ? error.message : ''
  const lowerMessage = message.toLowerCase()

  if (message.includes('권한') || lowerMessage.includes('permission') || lowerMessage.includes('denied')) {
    return '위치 권한이 필요해요. 지역 검색으로도 매장을 찾을 수 있어요.'
  }

  return '현재 위치를 가져오지 못했어요. 잠시 후 다시 시도해 주세요.'
}

function isSafeExploreReturnTo(returnTo: string | undefined) {
  return returnTo != null && returnTo.startsWith('/') && !returnTo.startsWith('//') ? returnTo : null
}

type MapBounds = MapViewport['bounds']

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
  const apiImages = [...(shop.images ?? [])]
    .sort((a, b) => {
      if (a.role !== b.role) {
        return a.role === 'PRIMARY' ? -1 : 1
      }

      return a.sortOrder - b.sortOrder
    })
    .map((image, index) => ({
      id: `shop-image-${image.id ?? index}`,
      src: image.url,
      alt: `${shop.name} 매장 이미지 ${index + 1}`,
    }))

  const localImages = uploadedPhotos.map((photo, index) => ({
    id: photo.id,
    src: photo.dataUrl,
    alt: `${shop.name} 업로드 이미지 ${index + 1}`,
  }))

  return [...apiImages, ...localImages]
}

function isShopInsideMapBounds(shop: Shop, bounds: MapBounds) {
  const isInsideLatitude = shop.py >= bounds.southWest.latitude && shop.py <= bounds.northEast.latitude
  const isInsideLongitude =
    bounds.southWest.longitude <= bounds.northEast.longitude
      ? shop.px >= bounds.southWest.longitude && shop.px <= bounds.northEast.longitude
      : shop.px >= bounds.southWest.longitude || shop.px <= bounds.northEast.longitude

  return isInsideLatitude && isInsideLongitude
}

function shopMatchesClientKeyword(shop: Shop, keyword: string, scope: 'shop' | 'work') {
  const normalizedKeyword = keyword.trim().toLocaleLowerCase()

  if (!normalizedKeyword) {
    return true
  }

  const values =
    scope === 'work'
      ? shop.works.map((work) => work.name)
      : [
          shop.name,
          shop.address,
          shop.regionName,
          ...shop.categories.map((category) => category.name),
          ...shop.works.map((work) => work.name),
        ]

  return values.some((value) => value?.toLocaleLowerCase().includes(normalizedKeyword))
}

export function ExplorePage() {
  const navigate = useNavigate()
  const location = useLocation()
  const routeState = location.state as ExploreLocationState
  const [searchParams, setSearchParams] = useSearchParams()
  const selectedFilters = useMemo(() => parseShopFilters(searchParams), [searchParams])
  const selectedSearchParams = useMemo(() => toShopSearchParams(selectedFilters), [selectedFilters])
  const authToken = useMemo(() => getStoredAccessToken(), [])
  const selectedShopId = Number(searchParams.get('shopId') ?? '') || null
  const sheetParam = searchParams.get('sheet')
  const viewParam = searchParams.get('view')
  const nearbyRequest = useMemo(() => readNearbyExploreParams(searchParams), [searchParams])
  const routeViewMode: ViewMode =
    viewParam === 'list' ? 'list' : viewParam === 'map' ? 'map' : nearbyRequest ? 'list' : 'map'
  const currentSearchScope = searchParams.get('scope') === 'work' ? 'work' : 'shop'
  const currentKeyword = searchParams.get('keyword')?.trim() ?? ''
  const [focusMode, setFocusMode] = useState<FocusMode>(nearbyRequest ? 'user' : selectedShopId ? 'shop' : 'shops')
  const [focusRequestId, setFocusRequestId] = useState(1)
  const sheetMode: SheetMode = selectedShopId && sheetParam === 'expanded' ? 'expanded' : 'peek'
  const [selectionOrigin, setSelectionOrigin] = useState<SelectionOrigin>(selectedShopId ? 'map' : null)
  const [visibleListCount, setVisibleListCount] = useState(PAGE_SIZE)
  const [userLocation, setUserLocation] = useState<UserLocation | null>(nearbyRequest?.location ?? null)
  const [locationState, setLocationState] = useState<'idle' | 'loading' | 'ready' | 'error'>(
    nearbyRequest ? 'ready' : 'idle',
  )
  const [locationError, setLocationError] = useState<string | null>(null)
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false)
  const [mapViewport, setMapViewport] = useState<MapViewport | null>(null)
  const [mapViewportFilter, setMapViewportFilter] = useState<MapBounds | null>(null)
  const [mapAreaSearchCenter, setMapAreaSearchCenter] = useState<MapViewport['center'] | null>(null)
  const [hasPendingMapSearch, setHasPendingMapSearch] = useState(false)
  const [isDetailHeaderCollapsed, setIsDetailHeaderCollapsed] = useState(false)
  const [detailTab, setDetailTab] = useState<MapDetailTab>('info')
  const [peekDragOffset, setPeekDragOffset] = useState(0)
  const [isPeekDragging, setIsPeekDragging] = useState(false)
  const [expandedDragOffset, setExpandedDragOffset] = useState(0)
  const [isExpandedDragging, setIsExpandedDragging] = useState(false)
  const [favoriteShopIds, setFavoriteShopIds] = useState<Set<number>>(() => new Set())
  const [favoriteQuickChipActive, setFavoriteQuickChipActive] = useState(false)
  const [favoriteToast, setFavoriteToast] = useState<string | null>(null)
  const [assistantOpen, setAssistantOpen] = useState(false)
  const [assistantInput, setAssistantInput] = useState('')
  const [assistantMessages, setAssistantMessages] = useState<MapAssistantMessage[]>([
    {
      id: 'assistant-welcome',
      role: 'assistant',
      content: '작품명, 지역명, 카테고리를 물어보면 지금 보이는 매장 기준으로 바로 추려드릴게요.',
    },
  ])
  const listScrollRef = useRef<HTMLDivElement | null>(null)
  const detailScrollRef = useRef<HTMLDivElement | null>(null)
  const assistantMessagesRef = useRef<HTMLDivElement | null>(null)
  const filterTriggerRef = useRef<HTMLButtonElement | null>(null)
  const locationErrorTimerRef = useRef<number | null>(null)
  const hasMapViewportRef = useRef(false)
  const listScrollTopRef = useRef(0)
  const listVisibleCountRef = useRef(PAGE_SIZE)
  const pendingListRestoreRef = useRef(false)
  const peekPointerIdRef = useRef<number | null>(null)
  const peekDragStartYRef = useRef<number | null>(null)
  const peekMovedRef = useRef(false)
  const expandedPointerIdRef = useRef<number | null>(null)
  const expandedDragStartYRef = useRef<number | null>(null)
  const effectiveUserLocation = userLocation ?? nearbyRequest?.location ?? null
  const appliedFilterCount = countShopFilters(selectedFilters)
  const hasAppliedFilterChips = appliedFilterCount > 0
  const activeMapQuickChips = useMemo(
    () => ({
      favorite: favoriteQuickChipActive,
    }),
    [favoriteQuickChipActive],
  )
  const isMapAreaNearbySearchActive = mapAreaSearchCenter != null && !favoriteQuickChipActive
  const usesTossNavigation = useMemo(() => isAppsInTossRuntime(), [])
  const safeRouteReturnTo = isSafeExploreReturnTo(routeState?.returnTo)
  const searchReturnTo = useMemo(() => {
    const next = new URLSearchParams(searchParams)

    next.delete('shopId')
    next.delete('sheet')
    next.set('view', 'list')

    return `${location.pathname}?${next.toString()}`
  }, [location.pathname, searchParams])
  const searchHref = useMemo(() => {
    const next = writeShopFilters(new URLSearchParams(), selectedFilters)

    next.set('returnTo', searchReturnTo)

    if (currentSearchScope === 'work') {
      next.set('scope', 'work')
    }

    if (currentKeyword) {
      next.set('keyword', currentKeyword)
    }

    return `/search?${next.toString()}`
  }, [currentKeyword, currentSearchScope, searchReturnTo, selectedFilters])
  const exploreSearchParams = useMemo(
    () => ({
      ...selectedSearchParams,
      ...(currentKeyword
        ? currentSearchScope === 'work'
          ? { workKeyword: currentKeyword }
          : { keyword: currentKeyword }
        : {}),
    }),
    [currentKeyword, currentSearchScope, selectedSearchParams],
  )

  const shopsQuery = useQuery({
    queryKey: ['shops', 'explore-map-source', exploreSearchParams],
    queryFn: () => getShops({ page: 0, size: MAP_FETCH_SIZE, ...exploreSearchParams }),
    placeholderData: keepPreviousData,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  })

  const favoriteShopsQuery = useQuery({
    queryKey: ['users', 'me', 'favorite-shops'],
    queryFn: () => listMyFavoriteShops(authToken),
    enabled: favoriteQuickChipActive && authToken != null,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  })

  const mapAreaNearbyQuery = useQuery({
    queryKey: ['shops', 'nearby-map-area', mapAreaSearchCenter],
    queryFn: () => {
      if (mapAreaSearchCenter == null) {
        return EMPTY_SHOPS
      }

      return getNearbyShops({ lat: mapAreaSearchCenter.latitude, lng: mapAreaSearchCenter.longitude })
    },
    enabled: mapAreaSearchCenter != null && !favoriteQuickChipActive,
    staleTime: 1000 * 60 * 2,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  })

  const appliedFacetParams = { includeRegions: true, includeCategories: true, includeWorkTypes: true, includeSorts: true }
  const appliedFacetQuery = useQuery({
    queryKey: shopFacetQueryKey(appliedFacetParams),
    queryFn: () => getShopFacets(appliedFacetParams),
    staleTime: SHOP_FACET_STALE_TIME_MS,
    gcTime: SHOP_FACET_GC_TIME_MS,
    refetchOnMount: 'always',
    enabled: hasAppliedFilterChips,
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

  const allShops = useMemo(
    () => {
      const sourceShops = favoriteQuickChipActive
        ? favoriteShopsQuery.data ?? EMPTY_SHOPS
        : isMapAreaNearbySearchActive
          ? mapAreaNearbyQuery.data ?? EMPTY_SHOPS
          : shopsQuery.data?.content ?? EMPTY_SHOPS

      if (selectedFilters.sort == null) {
        return sourceShops
      }

      return [...sourceShops].sort((a, b) => {
        if (selectedFilters.sort === 'REVIEW_COUNT_DESC') {
          return b.reviewCount - a.reviewCount
        }

        if (selectedFilters.sort === 'FAVORITE_COUNT_DESC') {
          return b.favoriteCount - a.favoriteCount
        }

        return 0
      })
    },
    [
      favoriteQuickChipActive,
      favoriteShopsQuery.data,
      isMapAreaNearbySearchActive,
      mapAreaNearbyQuery.data,
      selectedFilters.sort,
      shopsQuery.data?.content,
    ],
  )

  const filteredShops = useMemo(() => {
    return allShops.filter((shop) => {
      if (
        selectedSearchParams.regionIds != null &&
        selectedSearchParams.regionIds.length > 0 &&
        (shop.regionId == null || !selectedSearchParams.regionIds.includes(shop.regionId))
      ) {
        return false
      }

      if (
        selectedSearchParams.categoryIds != null &&
        selectedSearchParams.categoryIds.length > 0 &&
        !selectedSearchParams.categoryIds.some((categoryId) => shop.categoryIds?.includes(categoryId))
      ) {
        return false
      }

      if (
        selectedSearchParams.workIds != null &&
        selectedSearchParams.workIds.length > 0 &&
        !selectedSearchParams.workIds.some((workId) => shop.workIds?.includes(workId))
      ) {
        return false
      }

      if (selectedSearchParams.status != null && shop.status !== selectedSearchParams.status) {
        return false
      }

      if (mapViewportFilter && !isShopInsideMapBounds(shop, mapViewportFilter)) {
        return false
      }

      if (isMapAreaNearbySearchActive && !shopMatchesClientKeyword(shop, currentKeyword, currentSearchScope)) {
        return false
      }

      return true
    })
  }, [
    allShops,
    currentKeyword,
    currentSearchScope,
    isMapAreaNearbySearchActive,
    mapViewportFilter,
    selectedSearchParams.categoryIds,
    selectedSearchParams.regionIds,
    selectedSearchParams.status,
    selectedSearchParams.workIds,
  ])

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

    if (selectedFilters.sort != null) {
      return radiusFilteredShops
    }

    return [...radiusFilteredShops].sort((a, b) => (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity))
  }, [effectiveUserLocation, filteredShops, nearbyRequest, selectedFilters.sort])

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
  const selectedShopIsInFilteredResults =
    selectedShopId == null || shopsWithDistance.some((shop) => shop.id === selectedShopId)
  const activeShopsQueryIsPlaceholder = favoriteQuickChipActive
    ? false
    : isMapAreaNearbySearchActive
      ? mapAreaNearbyQuery.isPlaceholderData
      : shopsQuery.isPlaceholderData
  const activeShopsQueryIsSuccess = favoriteQuickChipActive
    ? favoriteShopsQuery.isSuccess
    : isMapAreaNearbySearchActive
      ? mapAreaNearbyQuery.isSuccess
      : shopsQuery.isSuccess
  const activeShopsQueryIsLoading = favoriteQuickChipActive
    ? favoriteShopsQuery.isLoading
    : isMapAreaNearbySearchActive
      ? mapAreaNearbyQuery.isLoading
      : shopsQuery.isLoading

  const detailShop = activeShopDetailQuery.data ?? activeShop ?? null
  const isFavoriteDetailShop = detailShop != null && favoriteShopIds.has(detailShop.id)

  useEffect(() => {
    if (
      selectedShopId == null ||
      appliedFilterCount === 0 ||
      activeShopsQueryIsPlaceholder ||
      !activeShopsQueryIsSuccess ||
      selectedShopIsInFilteredResults
    ) {
      return
    }

    const next = new URLSearchParams(searchParams)
    next.delete('shopId')
    next.delete('sheet')

    if (selectionOrigin === 'list') {
      next.set('view', 'list')
    } else {
      next.delete('view')
    }

    setSearchParams(next, { replace: true })
  }, [
    appliedFilterCount,
    searchParams,
    selectedShopId,
    selectedShopIsInFilteredResults,
    selectionOrigin,
    setSearchParams,
    activeShopsQueryIsPlaceholder,
    activeShopsQueryIsSuccess,
  ])

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

  const favoriteShopMutation = useMutation({
    mutationFn: ({ shopId, nextFavorite }: { shopId: number; nextFavorite: boolean }) =>
      nextFavorite ? addFavoriteShop(shopId) : removeFavoriteShop(shopId),
    onSuccess: (_result, variables) => {
      setFavoriteShopIds((current) => {
        const next = new Set(current)
        if (variables.nextFavorite) {
          next.add(variables.shopId)
        } else {
          next.delete(variables.shopId)
        }
        return next
      })
      setFavoriteToast(variables.nextFavorite ? '관심 매장에 저장했어요.' : '관심 매장에서 해제했어요.')
    },
    onError: (error) => {
      setFavoriteToast(error instanceof Error ? error.message : '관심 매장을 저장하지 못했어요.')
    },
  })

  const replaceSearchParams = (next: URLSearchParams) => {
    setSearchParams(next, { replace: true })
  }

  const pushSearchParams = (next: URLSearchParams) => {
    setSearchParams(next)
  }

  const moveViewMode = (nextViewMode: ViewMode) => {
    const next = new URLSearchParams(searchParams)

    next.set('view', nextViewMode)
    replaceSearchParams(next)
  }

  const clearLocationError = () => {
    if (locationErrorTimerRef.current != null) {
      window.clearTimeout(locationErrorTimerRef.current)
      locationErrorTimerRef.current = null
    }

    setLocationError(null)
  }

  const showLocationError = (message: string) => {
    if (locationErrorTimerRef.current != null) {
      window.clearTimeout(locationErrorTimerRef.current)
    }

    setLocationError(message)
    locationErrorTimerRef.current = window.setTimeout(() => {
      setLocationError(null)
      locationErrorTimerRef.current = null
    }, 3600)
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
    next.delete('view')
    if (nextSheetMode === 'expanded') {
      next.set('sheet', 'expanded')
    } else {
      next.delete('sheet')
    }

    if (selectedShopId == null) {
      pushSearchParams(next)
    } else {
      replaceSearchParams(next)
    }
    setSelectionOrigin(origin)
    setIsDetailHeaderCollapsed(false)
    setDetailTab('info')
    setAssistantOpen(false)
    if (origin === 'list') {
      requestMapFocus('shop')
    } else {
      setFocusMode('idle')
    }
  }

  const restoreListView = () => {
    const next = new URLSearchParams(searchParams)
    next.delete('shopId')
    next.delete('sheet')
    next.set('view', 'list')
    replaceSearchParams(next)
    pendingListRestoreRef.current = true
    setVisibleListCount(Math.max(PAGE_SIZE, listVisibleCountRef.current))
    setAssistantOpen(false)
    setDetailTab('info')
    requestMapFocus('shops')
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
    next.delete('sheet')
    next.delete('view')
    replaceSearchParams(next)
    setAssistantOpen(false)
    setDetailTab('info')
    setFocusMode('idle')
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

    moveViewMode(nextView)
  }

  const handleListFabClick = () => {
    if (selectedShopId != null) {
      restoreListView()
      return
    }

    handleSwitchView(isListSheetOpen ? 'map' : 'list')
  }

  const shrinkExpandedSheet = () => {
    if (selectedShopId != null && sheetParam === 'expanded') {
      const next = new URLSearchParams(searchParams)
      next.delete('sheet')
      replaceSearchParams(next)
    }

    setIsDetailHeaderCollapsed(false)
    setDetailTab('info')
    setExpandedDragOffset(0)
    setIsExpandedDragging(false)
    requestMapFocus('shop')
  }

  const handleExploreBack = () => {
    if (sheetMode === 'expanded') {
      shrinkExpandedSheet()
      return
    }

    const shouldReturnToSourceList = safeRouteReturnTo != null && isListSheetOpen

    if (shouldReturnToSourceList) {
      navigate(safeRouteReturnTo, { replace: true })
      return
    }

    if (isListSheetOpen) {
      handleSwitchView('map')
      return
    }

    if (selectedShopId != null && safeRouteReturnTo) {
      navigate(safeRouteReturnTo, { replace: true })
      return
    }

    if (selectedShopId != null) {
      handleClearSelection()
      return
    }

    navigate('/home', { replace: true })
  }

  const handleRequestLocation = async () => {
    if (locationState === 'loading') {
      return
    }

    setLocationState('loading')
    clearLocationError()

    try {
      const location = await requestCurrentLocation()
      setUserLocation(location)
      setLocationState('ready')
      clearLocationError()
      requestMapFocus('user')
    } catch (error) {
      setLocationState('error')
      showLocationError(getLocationErrorMessage(error))
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

    setMapAreaSearchCenter(mapViewport.center)
    setMapViewportFilter(mapViewport.bounds)
    setHasPendingMapSearch(false)
    setVisibleListCount(PAGE_SIZE)
  }

  const closeFilterSheet = useCallback(() => {
    setIsFilterSheetOpen(false)
  }, [])

  const removeAppliedFilterChip = useCallback(
    (chip: AppliedShopFilterChip) => {
      const nextFilters = removeAppliedShopFilterChip(selectedFilters, chip)

      setSearchParams(writeShopFilters(searchParams, nextFilters), { replace: true })
      setVisibleListCount(PAGE_SIZE)
    },
    [searchParams, selectedFilters, setSearchParams],
  )

  const applyFilters = useCallback(
    (nextFilters: ShopFilters) => {
      setSearchParams(writeShopFilters(searchParams, nextFilters), { replace: true })
      setVisibleListCount(PAGE_SIZE)
    },
    [searchParams, setSearchParams],
  )

  const toggleMapQuickChip = useCallback(
    (chipId: string) => {
      if (chipId === 'hours') {
        setFavoriteToast('영업 시간 필터는 준비 중이에요.')
        return
      }

      if (chipId === 'favorite') {
        if (authToken == null) {
          setFavoriteToast('로그인하면 관심 매장을 모아볼 수 있어요.')
          return
        }

        setFavoriteQuickChipActive((current) => !current)
        setVisibleListCount(PAGE_SIZE)
        return
      }

      return
    },
    [authToken],
  )

  const handleToggleFavoriteShop = () => {
    if (!detailShop || favoriteShopMutation.isPending) {
      return
    }

    if (authToken == null) {
      setFavoriteToast('로그인하면 관심 매장을 저장할 수 있어요.')
      return
    }

    favoriteShopMutation.mutate({ shopId: detailShop.id, nextFavorite: !isFavoriteDetailShop })
  }

  const shopsError = favoriteQuickChipActive && favoriteShopsQuery.isError
    ? (favoriteShopsQuery.error as Error).message
    : isMapAreaNearbySearchActive && mapAreaNearbyQuery.isError
      ? (mapAreaNearbyQuery.error as Error).message
    : shopsQuery.isError
      ? (shopsQuery.error as Error).message
      : null
  const detailError = activeShopDetailQuery.isError ? (activeShopDetailQuery.error as Error).message : null
  const detailFloorLabel = formatFloorLabel(detailShop?.floor ?? null)
  const detailDescription = detailShop?.description ?? detailShop?.visitTip ?? null
  const detailMediaTone = detailShop ? getDetailMediaTone(detailShop.id) : 'blue'
  const detailMediaItems = detailShop ? buildDetailMediaItems(detailShop, detailPhotosQuery.data ?? []) : []
  const detailPreviewMediaItems = detailMediaItems.slice(0, 5)
  const detailHeroImage = detailMediaItems[0] ?? null
  const activeDetailTab = detailTab === 'photos' && detailMediaItems.length <= 5 ? 'info' : detailTab
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
  const isFullListView = routeViewMode === 'list' && selectedShopId == null
  const isListSheetOpen = isFullListView
  const isExploreTopHidden = sheetMode === 'expanded'
  const assistantHasConversation = assistantMessages.some((message) => message.role === 'user')
  const showAssistantSuggestions = shouldShowAssistantSuggestions(assistantMessages)
  const showAssistantReturn =
    isMapAssistantEnabled && !assistantOpen && assistantHasConversation && !isListSheetOpen && sheetMode !== 'expanded'

  const renderAppliedFilterChips = () => (
    <AppliedFilterChips
      className="map-applied-filter-chips"
      filters={selectedFilters}
      facets={appliedFacetQuery.data}
      onRemoveFilter={removeAppliedFilterChip}
    />
  )

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
    if (selectedShopId != null && sheetParam !== 'expanded') {
      const next = new URLSearchParams(searchParams)
      next.set('shopId', String(selectedShopId))
      next.set('sheet', 'expanded')
      pushSearchParams(next)
    }

    setIsDetailHeaderCollapsed(false)
    setPeekDragOffset(0)
    setIsPeekDragging(false)
    setAssistantOpen(false)
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

  const resetExpandedDrag = () => {
    expandedPointerIdRef.current = null
    expandedDragStartYRef.current = null
    setExpandedDragOffset(0)
    setIsExpandedDragging(false)
  }

  const handleExpandedDragPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    expandedPointerIdRef.current = event.pointerId
    expandedDragStartYRef.current = event.clientY
    setIsExpandedDragging(true)
    event.currentTarget.setPointerCapture?.(event.pointerId)
  }

  const handleExpandedDragPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (expandedPointerIdRef.current !== event.pointerId || expandedDragStartYRef.current == null) {
      return
    }

    const deltaY = event.clientY - expandedDragStartYRef.current
    const nextOffset = Math.max(0, Math.min(deltaY, 112))
    setExpandedDragOffset(nextOffset)
  }

  const handleExpandedDragPointerEnd = (event: React.PointerEvent<HTMLDivElement>) => {
    if (expandedPointerIdRef.current !== event.pointerId || expandedDragStartYRef.current == null) {
      return
    }

    const deltaY = event.clientY - expandedDragStartYRef.current
    event.currentTarget.releasePointerCapture?.(event.pointerId)

    if (deltaY >= 44) {
      shrinkExpandedSheet()
      return
    }

    resetExpandedDrag()
  }

  const handleExpandedDragPointerCancel = () => {
    resetExpandedDrag()
  }

  useLayoutEffect(() => {
    if (!isListSheetOpen || !pendingListRestoreRef.current || !listScrollRef.current) {
      return
    }

    listScrollRef.current.scrollTop = listScrollTopRef.current
    pendingListRestoreRef.current = false
  }, [isListSheetOpen, visibleListCount])

  useEffect(() => {
    return () => {
      if (locationErrorTimerRef.current != null) {
        window.clearTimeout(locationErrorTimerRef.current)
      }
    }
  }, [])

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

  if (isFullListView) {
    return (
      <main className="map-page-shell">
        <section className="map-page map-page-list-mode">
          <div
            className={[
              'map-list-view',
              usesTossNavigation ? 'map-surface-toss-navigation' : 'map-surface-local-navigation',
            ]
              .filter(Boolean)
              .join(' ')}
          >
            {!usesTossNavigation ? (
              <AppTopNavigation className="map-route-navigation" showBack onBack={handleExploreBack} />
            ) : null}

            <div className="map-list-view-top">
              <ExploreTopSearch
                attachTriggerRef
                filterTriggerRef={filterTriggerRef}
                isFilterSheetOpen={isFilterSheetOpen}
                appliedFilterCount={appliedFilterCount}
                value={currentKeyword}
                onSearchClick={() => navigate(searchHref)}
                onFilterClick={() => setIsFilterSheetOpen(true)}
              />

              {shopsError ? <p className="error-text map-inline-error map-inline-error-overlay">{shopsError}</p> : null}
            </div>

            <SearchFilterSheet
              open={isFilterSheetOpen}
              triggerRef={filterTriggerRef}
              selectedFilters={selectedFilters}
              viewportBounds={mapViewport?.bounds ?? mapViewportFilter}
              onApplyFilters={applyFilters}
              onClose={closeFilterSheet}
            />

            <MapResultsSheet
              visible={isFullListView}
              appliedFilters={renderAppliedFilterChips()}
              visibleShops={visibleShops}
              totalShops={totalShops}
              isLoading={activeShopsQueryIsLoading}
              listRef={listScrollRef}
              onScroll={handleListScroll}
              onSelectShop={handleListSelectShop}
            />

            <MapOverlayControls
              visible
              showListToggle
              isListSheetOpen
              locationState={locationState}
              onListClick={handleListFabClick}
              onLocationClick={handleRequestLocation}
            />
          </div>
        </section>
      </main>
    )
  }

  return (
    <main className="map-page-shell">
      <Toast
        higherThanCTA
        open={favoriteToast != null}
        text={favoriteToast ?? ''}
        onClose={() => setFavoriteToast(null)}
      />
      <section className="map-page">
        <div
          className={[
            'map-surface',
            'map-surface-app',
            'map-surface-app-v2',
            usesTossNavigation ? 'map-surface-toss-navigation' : 'map-surface-local-navigation',
            detailShop ? 'map-surface-sheet-open' : '',
            sheetMode === 'peek' && detailShop ? 'map-surface-sheet-peek' : '',
            sheetMode === 'expanded' ? 'map-surface-sheet-expanded' : '',
            isListSheetOpen ? 'map-surface-list-open' : '',
          ]
            .filter(Boolean)
            .join(' ')}
        >
          {!usesTossNavigation ? (
            <AppTopNavigation className="map-route-navigation" showBack onBack={handleExploreBack} />
          ) : null}

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

          <div
            className={`map-explore-top ${isExploreTopHidden ? 'map-explore-top-hidden' : ''}`}
            aria-hidden={isExploreTopHidden}
          >
            {!isExploreTopHidden ? (
              <>
                <ExploreTopSearch
                  attachTriggerRef
                  filterTriggerRef={filterTriggerRef}
                  isFilterSheetOpen={isFilterSheetOpen}
                  appliedFilterCount={appliedFilterCount}
                  value={currentKeyword}
                  onSearchClick={() => navigate(searchHref)}
                  onFilterClick={() => setIsFilterSheetOpen(true)}
                />
                <div className="map-chip-composite-row">
                  <MapQuickChips items={MAP_QUICK_CHIPS} activeItems={activeMapQuickChips} onToggle={toggleMapQuickChip} />
                  {renderAppliedFilterChips()}
                </div>

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

                {shopsError ? <p className="error-text map-inline-error map-inline-error-overlay">{shopsError}</p> : null}
              </>
            ) : null}
          </div>

          <SearchFilterSheet
            open={isFilterSheetOpen}
            triggerRef={filterTriggerRef}
            selectedFilters={selectedFilters}
            viewportBounds={mapViewport?.bounds ?? mapViewportFilter}
            onApplyFilters={applyFilters}
            onClose={closeFilterSheet}
          />

          {locationError && sheetMode !== 'expanded' && !isListSheetOpen ? (
            <p className="map-location-error-toast" role="status">
              {locationError}
            </p>
          ) : null}

          <MapOverlayControls
            visible={sheetMode !== 'expanded'}
            showListToggle={sheetMode !== 'expanded'}
            isListSheetOpen={isListSheetOpen}
            locationState={locationState}
            onListClick={handleListFabClick}
            onLocationClick={handleRequestLocation}
          />

          <MapAssistantPanel
            visible={isMapAssistantEnabled && !isListSheetOpen && sheetMode !== 'expanded'}
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
              className={[
                'map-bottom-sheet',
                'map-bottom-sheet-expanded',
                isExpandedDragging ? 'map-bottom-sheet-expanded-dragging' : '',
              ]
                .filter(Boolean)
                .join(' ')}
              id="map-place-detail"
              aria-label={`${detailShop.name} 상세 정보`}
              style={expandedDragOffset > 0 ? { transform: `translateY(${expandedDragOffset}px)` } : undefined}
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
                  <strong>{detailShop.name}</strong>
                </div>

                <MapDetailMediaSection
                  shop={detailShop}
                  tone={detailMediaTone}
                  detailMediaItems={detailPreviewMediaItems}
                  totalMediaCount={detailMediaItems.length}
                  onDragHandlePointerCancel={handleExpandedDragPointerCancel}
                  onDragHandlePointerDown={handleExpandedDragPointerDown}
                  onDragHandlePointerMove={handleExpandedDragPointerMove}
                  onDragHandlePointerUp={handleExpandedDragPointerEnd}
                />

                <div className="map-sheet-shell map-sheet-shell-detail">
                  {detailError ? <p className="section error-text">{detailError}</p> : null}

                  <MapDetailSummaryCard
                    shop={detailShop}
                    activeTab={activeDetailTab}
                    isFavorite={isFavoriteDetailShop}
                    isFavoritePending={favoriteShopMutation.isPending}
                    photoCount={detailMediaItems.length}
                    onTabChange={setDetailTab}
                    onToggleFavorite={handleToggleFavoriteShop}
                  />

                  {activeDetailTab === 'info' ? (
                    <MapDetailInfoCard
                      shop={detailShop}
                      description={detailDescription}
                      floorLabel={detailFloorLabel}
                      distanceLabel={activeShop?.distanceLabel ?? null}
                      onOpenDirections={openNaverDirections}
                    />
                  ) : null}

                  <MapDetailSupplementSections
                    shop={detailShop}
                    activeTab={activeDetailTab}
                    mediaItems={detailMediaItems}
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
