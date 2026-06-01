import { type UIEvent, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { openURL } from '@apps-in-toss/web-framework'
import { keepPreviousData, useMutation, useQueries, useQuery, useQueryClient } from '@tanstack/react-query'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { askMapAssistant } from '../shared/api/llm'
import { addFavoriteShop, getNearbyShops, getShop, getShopFacets, getShops, removeFavoriteShop } from '../shared/api/shops'
import { getWorks } from '../shared/api/works'
import { listMyFavoriteShops } from '../shared/api/users'
import {
  createShopReview,
  deleteShopReview,
  likeShopReview,
  listShopReviews,
  unlikeShopReview,
  updateShopReview,
} from '../shared/api/shopReviews'
import type { CreateShopReviewPayload, Shop, ShopReview, UpdateShopReviewPayload, WorkCatalogItem, WorkType } from '../shared/api/types'
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
  buildNaverAppDirectionUrl,
  buildNaverAppSearchUrl,
  buildNaverMapSearchUrl,
  buildNaverWebDirectionUrl,
  canBuildNaverWebDirectionUrl,
} from '../shared/lib/naverDirections'
import { isAppsInTossRuntime } from '../shared/lib/auth'
import { getStoredAccessToken, readAuthSession } from '../shared/lib/authSession'
import { AppliedFilterChips } from '../shared/ui/AppliedFilterChips'
import { SearchFilterSheet } from '../shared/ui/SearchFilterSheet'
import { AppTopNavigation } from '../shared/ui/AppTopNavigation'
import { type MapViewport, ShopMap } from '../shared/ui/ShopMap'
import { Toast } from '@aniwhere/tds-mobile'
import { MapAssistantPanel, type MapAssistantMessage } from './explore/MapAssistantPanel'
import { MapDetailInfoCard } from './explore/MapDetailInfoCard'
import { MapDetailMediaSection, type MapDetailMediaItem } from './explore/MapDetailMediaSection'
import {
  MapDetailSummaryCard,
  MapDetailTabs,
  type MapDetailTab,
} from './explore/MapDetailSummaryCard'
import {
  MapDetailSupplementSections,
  MapPhotoViewer,
  type MapPhotoViewerState,
  type PhotoViewerItem,
} from './explore/MapDetailSupplementSections'
import { ExploreTopSearch } from './explore/ExploreTopSearch'
import { MapOverlayControls } from './explore/MapOverlayControls'
import { MapPeekSheet } from './explore/MapPeekSheet'
import { MapQuickChips, type MapQuickChipItem } from './explore/MapQuickChips'
import { MapReviewStation } from './explore/MapReviewStation'
import { MapResultsSheet, type MapResultReviewPhoto } from './explore/MapResultsSheet'
import { readNearbyExploreParams } from './searchNearby'

const PAGE_SIZE = 10
const MAP_FETCH_SIZE = 200
const EMPTY_SHOPS: Shop[] = []
const MAP_QUICK_CHIPS: MapQuickChipItem[] = [
  { id: 'hours', label: '영업중', icon: 'time', ariaLabel: '영업중 필터', hidden: true },
  { id: 'favorite', label: '관심매장', icon: 'star' },
]
const isMapAssistantEnabled = false
const ASSISTANT_SUGGESTIONS = ['홍대에서 피규어 많은 곳', '피규어 종류가 많은 매장', '초행자에게 추천할 만한 곳']
const ASSISTANT_RETRY_HINT = '현재 데이터 기준으로 바로 맞는 후보를 찾지 못했어요. 작품명, 지역명, 매장명을 조금 더 구체적으로 입력해보세요.'
const WORK_TYPE_LABELS: Record<WorkType, string> = {
  ANIMATION: '애니메이션',
  GAME: '게임',
}

type FocusMode = 'shops' | 'shop' | 'user' | 'idle'
type ViewMode = 'map' | 'list'
type SheetMode = 'peek' | 'expanded' | 'review'
type SelectionOrigin = 'map' | 'list' | null
type ExploreLocationState = {
  returnTo?: string
} | null
type DetailMediaItem = {
  id: string
  src: string
  alt: string
  kind: 'shop' | 'review'
  registeredAt: number
  sortOrder: number
  review?: ShopReview
  reviewImages?: PhotoViewerItem[]
  reviewPhotoIndex?: number
}

function parseDetailTab(value: string | null): MapDetailTab | null {
  if (value === 'info' || value === 'review' || value === 'photos') {
    return value
  }

  return null
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

async function openExternalMapUrl(primaryUrl: string | null, fallbackUrl?: string | null) {
  if (!primaryUrl && !fallbackUrl) {
    return
  }

  if (isAppsInTossRuntime()) {
    try {
      if (primaryUrl) {
        await openURL(primaryUrl)
        return
      }
    } catch {
      // Fall through to the web fallback when the native map scheme is unavailable.
    }

    if (fallbackUrl != null) {
      await openURL(fallbackUrl)
    }
    return
  }

  if (fallbackUrl != null) {
    window.open(fallbackUrl, '_blank', 'noopener,noreferrer')
    return
  }

  if (primaryUrl != null) {
    window.open(primaryUrl, '_blank', 'noopener,noreferrer')
  }
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

function formatFloorLabel(floor: string | null) {
  if (!floor) {
    return null
  }

  const normalized = floor.trim()
  return normalized.endsWith('층') ? normalized : `${normalized}층`
}

function buildDetailMediaItems(shop: Shop): DetailMediaItem[] {
  const registeredAt = Date.parse(shop.updatedAt || shop.createdAt) || 0

  return [...(shop.images ?? [])]
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
      kind: 'shop',
      registeredAt,
      sortOrder: image.sortOrder,
    }))
}

function getWorkTypeLabel(type: WorkType | null | undefined) {
  return type == null ? null : WORK_TYPE_LABELS[type] ?? type
}

function getShopWorkTypeLabels(shop: Shop, workCatalogById: Map<number, WorkCatalogItem>) {
  const labels = new Set<string>()

  shop.works.forEach((work) => {
    const label = getWorkTypeLabel(work.type ?? workCatalogById.get(work.id)?.type)

    if (label != null) {
      labels.add(label)
    }
  })

  return [...labels]
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
  const queryClient = useQueryClient()
  const selectedFilters = useMemo(() => parseShopFilters(searchParams), [searchParams])
  const selectedSearchParams = useMemo(() => toShopSearchParams(selectedFilters), [selectedFilters])
  const authToken = useMemo(() => getStoredAccessToken(), [])
  const currentUser = useMemo(() => readAuthSession()?.user ?? null, [])
  const currentUserId = currentUser?.id ?? null
  const selectedShopId = Number(searchParams.get('shopId') ?? '') || null
  const sheetParam = searchParams.get('sheet')
  const viewParam = searchParams.get('view')
  const detailTabParam = parseDetailTab(searchParams.get('tab'))
  const detailFocusParam = searchParams.get('focus')
  const detailReviewFocusId = Number(searchParams.get('reviewId') ?? '') || null
  const shouldFocusRouteReview = detailFocusParam === 'review'
  const nearbyRequest = useMemo(() => readNearbyExploreParams(searchParams), [searchParams])
  const routeViewMode: ViewMode =
    viewParam === 'list' ? 'list' : viewParam === 'map' ? 'map' : nearbyRequest ? 'list' : 'map'
  const currentSearchScope = searchParams.get('scope') === 'work' ? 'work' : 'shop'
  const currentKeyword = searchParams.get('keyword')?.trim() ?? ''
  const [focusMode, setFocusMode] = useState<FocusMode>(nearbyRequest ? 'user' : selectedShopId ? 'shop' : 'shops')
  const [focusRequestId, setFocusRequestId] = useState(1)
  const sheetMode: SheetMode =
    selectedShopId && sheetParam === 'review' ? 'review' : selectedShopId && sheetParam === 'expanded' ? 'expanded' : 'peek'
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
  const [detailTab, setDetailTab] = useState<MapDetailTab>(() => detailTabParam ?? 'info')
  const [detailPhotoViewerState, setDetailPhotoViewerState] = useState<MapPhotoViewerState | null>(null)
  const [editingReview, setEditingReview] = useState<ShopReview | null>(null)
  const [peekDragOffset, setPeekDragOffset] = useState(0)
  const [isPeekDragging, setIsPeekDragging] = useState(false)
  const [expandedDragOffset, setExpandedDragOffset] = useState(0)
  const [isExpandedDragging, setIsExpandedDragging] = useState(false)
  const [favoriteShopIdOverrides, setFavoriteShopIdOverrides] = useState<Map<number, boolean>>(() => new Map())
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
  const previousSelectedShopIdRef = useRef<number | null>(selectedShopId)
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
    next.delete('tab')
    next.delete('focus')
    next.delete('reviewId')
    next.set('view', routeViewMode)

    return `${location.pathname}?${next.toString()}`
  }, [location.pathname, routeViewMode, searchParams])
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
    enabled: authToken != null,
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

  const worksCatalogQuery = useQuery({
    queryKey: ['works', 'explore-work-type-labels'],
    queryFn: () => getWorks(),
    enabled: allShops.some((shop) => shop.works.length > 0),
    staleTime: 1000 * 60 * 10,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  })

  const workCatalogById = useMemo(() => {
    return new Map((worksCatalogQuery.data ?? []).map((work) => [work.id, work]))
  }, [worksCatalogQuery.data])

  const favoriteShopIds = useMemo(() => {
    const nextFavoriteShopIds = new Set(favoriteShopsQuery.data?.map((shop) => shop.id) ?? [])

    favoriteShopIdOverrides.forEach((isFavorite, shopId) => {
      if (isFavorite) {
        nextFavoriteShopIds.add(shopId)
        return
      }

      nextFavoriteShopIds.delete(shopId)
    })

    return nextFavoriteShopIds
  }, [favoriteShopIdOverrides, favoriteShopsQuery.data])

  const workTypeLabelsByShopId = useMemo(() => {
    const nextLabelsByShopId: Record<number, string[]> = {}

    allShops.forEach((shop) => {
      const labels = getShopWorkTypeLabels(shop, workCatalogById)

      if (labels.length > 0) {
        nextLabelsByShopId[shop.id] = labels
      }
    })

    return nextLabelsByShopId
  }, [allShops, workCatalogById])

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
  const reviewListQuery = useQuery({
    queryKey: ['shop-reviews', detailShop?.id],
    queryFn: () => listShopReviews((detailShop as Shop).id, { page: 0, size: 20, sort: 'NEWEST' }, authToken),
    enabled:
      detailShop != null &&
      sheetMode === 'expanded' &&
      (detailTab === 'review' || detailTab === 'photos' || detailShop.reviewCount > 0),
    staleTime: 1000 * 30,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  })

  useEffect(() => {
    if (selectedShopId == null || sheetMode !== 'expanded' || detailTabParam == null) {
      return
    }

    setDetailTab(detailTabParam)
  }, [detailTabParam, selectedShopId, sheetMode])

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
      nextFavorite ? addFavoriteShop(shopId, authToken) : removeFavoriteShop(shopId, authToken),
    onSuccess: async (_result, variables) => {
      setFavoriteShopIdOverrides((current) => {
        const next = new Map(current)
        next.set(variables.shopId, variables.nextFavorite)
        return next
      })
      await queryClient.invalidateQueries({ queryKey: ['users', 'me', 'favorite-shops'] })
      setFavoriteToast(variables.nextFavorite ? '관심 매장에 저장했어요.' : '관심 매장에서 해제했어요.')
    },
    onError: (error) => {
      setFavoriteToast(error instanceof Error ? error.message : '관심 매장을 저장하지 못했어요.')
    },
  })

  const reviewCreateMutation = useMutation({
    mutationFn: ({
      shopId,
      payload,
    }: {
      shopId: number
      payload: CreateShopReviewPayload
    }) => {
      if (authToken == null) {
        throw new Error('로그인 후 리뷰를 작성할 수 있어요.')
      }

      return createShopReview(shopId, payload, authToken)
    },
    onSuccess: async (_review, variables) => {
      setFavoriteToast('리뷰를 등록했어요.')
      setEditingReview(null)
      setDetailTab('review')
      const next = new URLSearchParams(searchParams)
      next.set('shopId', String(variables.shopId))
      next.set('sheet', 'expanded')
      replaceSearchParams(next)

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['shops'] }),
        queryClient.invalidateQueries({ queryKey: ['shops', 'explore-active-detail', variables.shopId] }),
        queryClient.invalidateQueries({ queryKey: ['shop-reviews', variables.shopId] }),
        queryClient.invalidateQueries({ queryKey: ['users', 'me', 'reviews'] }),
      ])
    },
  })

  const reviewUpdateMutation = useMutation({
    mutationFn: ({
      shopId,
      reviewId,
      payload,
    }: {
      shopId: number
      reviewId: number
      payload: UpdateShopReviewPayload
    }) => {
      if (authToken == null) {
        throw new Error('로그인 후 리뷰를 수정할 수 있어요.')
      }

      return updateShopReview(shopId, reviewId, payload, authToken)
    },
    onSuccess: async (_review, variables) => {
      setFavoriteToast('리뷰를 수정했어요.')
      setEditingReview(null)
      setDetailTab('review')
      const next = new URLSearchParams(searchParams)
      next.set('shopId', String(variables.shopId))
      next.set('sheet', 'expanded')
      replaceSearchParams(next)

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['shops'] }),
        queryClient.invalidateQueries({ queryKey: ['shops', 'explore-active-detail', variables.shopId] }),
        queryClient.invalidateQueries({ queryKey: ['shop-reviews', variables.shopId] }),
        queryClient.invalidateQueries({ queryKey: ['users', 'me', 'reviews'] }),
      ])
    },
  })

  const reviewDeleteMutation = useMutation({
    mutationFn: ({ shopId, reviewId }: { shopId: number; reviewId: number }) => {
      if (authToken == null) {
        throw new Error('로그인 후 리뷰를 삭제할 수 있어요.')
      }

      return deleteShopReview(shopId, reviewId, authToken)
    },
    onSuccess: async (_result, variables) => {
      setFavoriteToast('리뷰를 삭제했어요.')

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['shops'] }),
        queryClient.invalidateQueries({ queryKey: ['shops', 'explore-active-detail', variables.shopId] }),
        queryClient.invalidateQueries({ queryKey: ['shop-reviews', variables.shopId] }),
        queryClient.invalidateQueries({ queryKey: ['users', 'me', 'reviews'] }),
      ])
    },
    onError: (error) => {
      setFavoriteToast(error instanceof Error ? error.message : '리뷰를 삭제하지 못했어요.')
    },
  })

  const reviewLikeMutation = useMutation({
    mutationFn: ({ shopId, reviewId, nextLiked }: { shopId: number; reviewId: number; nextLiked: boolean }) => {
      if (authToken == null) {
        throw new Error('로그인 후 유용한 리뷰를 표시할 수 있어요.')
      }

      return nextLiked ? likeShopReview(shopId, reviewId, authToken) : unlikeShopReview(shopId, reviewId, authToken)
    },
    onSuccess: async (_result, variables) => {
      setFavoriteToast(variables.nextLiked ? '유용한 리뷰로 표시했어요.' : '유용해요를 취소했어요.')

      await queryClient.invalidateQueries({ queryKey: ['shop-reviews', variables.shopId] })
    },
    onError: (error) => {
      setFavoriteToast(error instanceof Error ? error.message : '리뷰 유용해요를 처리하지 못했어요.')
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

  const closeReviewStation = () => {
    if (selectedShopId == null) {
      return
    }

    const next = new URLSearchParams(searchParams)
    next.set('shopId', String(selectedShopId))
    next.set('sheet', 'expanded')
    replaceSearchParams(next)
    setDetailTab('review')
    reviewCreateMutation.reset()
    reviewUpdateMutation.reset()
    setEditingReview(null)
  }

  const openReviewStation = (review: ShopReview | null = null) => {
    if (!detailShop) {
      return
    }

    const next = new URLSearchParams(searchParams)
    next.set('shopId', String(detailShop.id))
    next.set('sheet', 'review')
    setEditingReview(review ?? null)
    reviewCreateMutation.reset()
    reviewUpdateMutation.reset()
    pushSearchParams(next)
    setAssistantOpen(false)
  }
  const openCreateReviewStation = () => openReviewStation(null)
  const openEditReviewStation = (review: ShopReview) => openReviewStation(review)
  const openReportReviewNotice = () => {
    setFavoriteToast('리뷰 신고 기능은 준비 중이에요.')
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
      setFocusMode('idle')
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
    if (selectedShopId != null && (sheetParam === 'expanded' || sheetParam === 'review')) {
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
    if (sheetMode === 'review') {
      closeReviewStation()
      return
    }

    if (sheetMode === 'expanded' && selectionOrigin === 'list') {
      pendingListRestoreRef.current = true
      navigate(-1)
      return
    }

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
  const detailWorkTypeLabels = detailShop ? workTypeLabelsByShopId[detailShop.id] ?? [] : []
  const detailShopMediaItems = useMemo(() => (detailShop ? buildDetailMediaItems(detailShop) : []), [detailShop])
  const detailReviewMediaItems = useMemo(() => {
    return (reviewListQuery.data?.content ?? []).flatMap((review) => {
      const registeredAt = Date.parse(review.updatedAt ?? review.createdAt) || 0
      const reviewImages = review.images.map<PhotoViewerItem>((image, index) => ({
        id: `review-${review.id}-${image.id ?? image.sortOrder}-${index}`,
        src: image.url,
        alt: `${review.authorNickname} 리뷰 사진 ${index + 1}`,
      }))

      return reviewImages.map<DetailMediaItem>((image, index) => ({
        ...image,
        kind: 'review',
        registeredAt,
        sortOrder: index,
        review,
        reviewImages,
        reviewPhotoIndex: index,
      }))
    })
  }, [reviewListQuery.data])
  const detailMediaItems = useMemo(() => [...detailShopMediaItems, ...detailReviewMediaItems].sort((a, b) => {
    if (a.registeredAt !== b.registeredAt) {
      return b.registeredAt - a.registeredAt
    }

    if (a.kind !== b.kind) {
      return a.kind === 'shop' ? -1 : 1
    }

    return a.sortOrder - b.sortOrder
  }), [detailReviewMediaItems, detailShopMediaItems])
  const detailPreviewMediaItems = detailMediaItems.slice(0, 4)
  const detailPhotoCount = detailMediaItems.length
  const activeDetailTab = detailTab === 'photos' && detailPhotoCount <= 0 ? 'info' : detailTab

  useEffect(() => {
    if (
      selectedShopId == null ||
      sheetMode !== 'expanded' ||
      activeDetailTab !== 'review' ||
      !shouldFocusRouteReview
    ) {
      return
    }

    const timeoutId = window.setTimeout(
      () => {
        const reviewSection =
          detailScrollRef.current?.querySelector<HTMLElement>('#map-place-review') ??
          document.getElementById('map-place-review')
        const focusedReview =
          detailReviewFocusId != null
            ? detailScrollRef.current?.querySelector<HTMLElement>(`[data-review-id="${detailReviewFocusId}"]`)
            : null
        const target = focusedReview ?? reviewSection

        if (target == null) {
          return
        }

        target.scrollIntoView({ block: 'start', behavior: 'smooth' })
        target.focus({ preventScroll: true })
      },
      reviewListQuery.isFetching ? 80 : 0,
    )

    return () => window.clearTimeout(timeoutId)
  }, [
    activeDetailTab,
    detailReviewFocusId,
    reviewListQuery.data,
    reviewListQuery.isFetching,
    selectedShopId,
    sheetMode,
    shouldFocusRouteReview,
  ])

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
  const naverAppDirectionUrl = naverDirectionTarget && canBuildNaverWebDirectionUrl(naverDirectionTarget)
    ? buildNaverAppDirectionUrl(
        naverDirectionTarget,
        effectiveUserLocation ? { ...effectiveUserLocation, name: '현재 위치' } : null,
      )
    : null
  const naverSearchUrl = detailShop ? buildNaverMapSearchUrl(`${detailShop.name} ${detailShop.address}`) : null
  const naverAppSearchUrl = detailShop ? buildNaverAppSearchUrl(`${detailShop.name} ${detailShop.address}`) : null
  const isFullListView = routeViewMode === 'list' && selectedShopId == null
  const listReviewQueries = useQueries({
    queries: visibleShops.map((shop) => ({
      queryKey: ['shop-reviews', 'list-card', shop.id, authToken != null],
      queryFn: () => listShopReviews(shop.id, { page: 0, size: 20, sort: 'NEWEST' }, authToken),
      enabled: isFullListView && shop.reviewCount > 0,
      staleTime: 1000 * 30,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
    })),
  })
  const listReviewPhotosByShopId = useMemo(() => {
    const nextPhotosByShopId: Record<number, MapResultReviewPhoto[]> = {}

    visibleShops.forEach((shop, shopIndex) => {
      const reviewPage = listReviewQueries[shopIndex]?.data

      if (!reviewPage) {
        return
      }

      const reviewPhotos = reviewPage.content.flatMap((review) => {
        const registeredAt = Date.parse(review.updatedAt ?? review.createdAt) || 0

        return review.images.map<MapResultReviewPhoto>((image, imageIndex) => ({
          id: `review-${review.id}-${image.id ?? image.sortOrder}-${imageIndex}`,
          url: image.url,
          alt: `${review.authorNickname} 리뷰 사진 ${imageIndex + 1}`,
          kind: 'review',
          registeredAt,
          sortOrder: image.sortOrder,
        }))
      })

      if (reviewPhotos.length > 0) {
        nextPhotosByShopId[shop.id] = reviewPhotos
      }
    })

    return nextPhotosByShopId
  }, [listReviewQueries, visibleShops])
  const isListSheetOpen = isFullListView
  const isExploreTopHidden = sheetMode === 'expanded' || sheetMode === 'review'
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

  const openDetailMediaItem = (item: MapDetailMediaItem) => {
    const detailItem = item as DetailMediaItem

    if (detailItem.kind === 'review' && detailItem.review && detailItem.reviewImages && detailItem.reviewPhotoIndex != null) {
      setDetailPhotoViewerState({
        items: detailItem.reviewImages,
        activeIndex: detailItem.reviewPhotoIndex,
        review: detailItem.review,
      })
      return
    }

    const shopViewerItems = detailShopMediaItems.map<PhotoViewerItem>((mediaItem) => ({
      id: mediaItem.id,
      src: mediaItem.src,
      alt: mediaItem.alt,
    }))
    const activeIndex = Math.max(0, detailShopMediaItems.findIndex((mediaItem) => mediaItem.id === detailItem.id))

    if (shopViewerItems.length > 0) {
      setDetailPhotoViewerState({
        items: shopViewerItems,
        activeIndex,
      })
    }
  }

  const handleDetailPhotoViewerIndexChange = (activeIndex: number) => {
    setDetailPhotoViewerState((current) => (current == null ? current : { ...current, activeIndex }))
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
    const previousSelectedShopId = previousSelectedShopIdRef.current
    previousSelectedShopIdRef.current = selectedShopId

    if (previousSelectedShopId != null && selectedShopId == null && isFullListView && selectionOrigin === 'list') {
      pendingListRestoreRef.current = true
      setVisibleListCount(Math.max(PAGE_SIZE, listVisibleCountRef.current))
      setAssistantOpen(false)
      setDetailTab('info')
      requestMapFocus('shops')
      setSelectionOrigin(null)
    }
  }, [isFullListView, requestMapFocus, selectedShopId, selectionOrigin])

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

    void openExternalMapUrl(naverAppDirectionUrl ?? naverAppSearchUrl, naverDirectionUrl ?? naverSearchUrl)
  }

  const shareShopDetail = async (shop: Shop) => {
    const shareUrl = new URL('/explore', window.location.origin)
    shareUrl.searchParams.set('shopId', String(shop.id))
    shareUrl.searchParams.set('sheet', 'expanded')

    try {
      if (navigator.share) {
        await navigator.share({ title: shop.name, url: shareUrl.toString() })
        return
      }

      if (!navigator.clipboard) {
        throw new Error('Clipboard API unavailable')
      }

      await navigator.clipboard.writeText(shareUrl.toString())
      setFavoriteToast('매장 링크를 복사했어요.')
    } catch {
      setFavoriteToast('공유를 완료하지 못했어요.')
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
              favoriteShopIds={favoriteShopIds}
              reviewPhotosByShopId={listReviewPhotosByShopId}
              workTypeLabelsByShopId={workTypeLabelsByShopId}
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
            sheetMode === 'review' ? 'map-surface-sheet-review' : '',
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
            favoriteShopIds={favoriteShopIds}
            onSelectShop={handleMapSelectShop}
            onClearSelection={handleClearSelection}
            onViewportChange={handleMapViewportChange}
            restoreViewport={mapViewport}
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
            visible={sheetMode !== 'expanded' && sheetMode !== 'review'}
            showListToggle={sheetMode !== 'expanded' && sheetMode !== 'review'}
            isListSheetOpen={isListSheetOpen}
            locationState={locationState}
            onListClick={handleListFabClick}
            onLocationClick={handleRequestLocation}
          />

          <MapAssistantPanel
            visible={isMapAssistantEnabled && !isListSheetOpen && sheetMode !== 'expanded' && sheetMode !== 'review'}
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
            isDragging={isPeekDragging}
            dragOffset={peekDragOffset}
            selectionOrigin={selectionOrigin}
            onClick={handlePeekClick}
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

                <div className="map-sheet-shell map-sheet-shell-detail">
                  <div
                    className="map-sheet-expanded-drag-handle"
                    aria-hidden="true"
                    onPointerCancel={handleExpandedDragPointerCancel}
                    onPointerDown={handleExpandedDragPointerDown}
                    onPointerMove={handleExpandedDragPointerMove}
                    onPointerUp={handleExpandedDragPointerEnd}
                  >
                    <span />
                  </div>

                  {detailError ? <p className="section error-text">{detailError}</p> : null}

                  <MapDetailSummaryCard
                    shop={detailShop}
                    workTypeLabels={detailWorkTypeLabels}
                    isFavorite={isFavoriteDetailShop}
                    isFavoritePending={favoriteShopMutation.isPending}
                    onToggleFavorite={handleToggleFavoriteShop}
                    onShare={() => {
                      void shareShopDetail(detailShop)
                    }}
                  />

                  <MapDetailMediaSection
                    detailMediaItems={detailPreviewMediaItems}
                    totalMediaCount={detailMediaItems.length}
                    onOpenMediaItem={openDetailMediaItem}
                    onOpenMoreMedia={() => setDetailTab('photos')}
                  />

                  {detailPhotoViewerState != null ? (
                    <MapPhotoViewer
                      state={detailPhotoViewerState}
                      onActiveIndexChange={handleDetailPhotoViewerIndexChange}
                      onClose={() => setDetailPhotoViewerState(null)}
                      currentUserId={currentUserId}
                      onEditReview={openEditReviewStation}
                      onReportReview={openReportReviewNotice}
                      onShowReview={() => setDetailTab('review')}
                    />
                  ) : null}

                  <MapDetailTabs
                    activeTab={activeDetailTab}
                    photoCount={detailPhotoCount}
                    reviewCount={detailShop.reviewCount}
                    onTabChange={setDetailTab}
                  />

                  {activeDetailTab === 'info' ? (
                    <MapDetailInfoCard
                      shop={detailShop}
                      description={detailDescription}
                      floorLabel={detailFloorLabel}
                      workTypeLabels={detailWorkTypeLabels}
                      distanceLabel={activeShop?.distanceLabel ?? null}
                      onOpenDirections={openNaverDirections}
                    />
                  ) : null}

                  <MapDetailSupplementSections
                    shop={detailShop}
                    activeTab={activeDetailTab}
                    mediaItems={detailShopMediaItems}
                    reviewPage={reviewListQuery.data ?? null}
                    isReviewLoading={reviewListQuery.isLoading}
                    reviewErrorMessage={reviewListQuery.error instanceof Error ? reviewListQuery.error.message : null}
                    currentUserId={currentUserId}
                    currentUserEmojiIconFilename={currentUser?.emojiIconFilename ?? null}
                    currentUserNickname={currentUser?.nickname ?? null}
                    deletingReviewId={
                      reviewDeleteMutation.variables != null && reviewDeleteMutation.isPending
                        ? reviewDeleteMutation.variables.reviewId
                        : null
                    }
                    likingReviewId={
                      reviewLikeMutation.variables != null && reviewLikeMutation.isPending
                        ? reviewLikeMutation.variables.reviewId
                        : null
                    }
                    onStartReview={openCreateReviewStation}
                    onEditReview={openEditReviewStation}
                    onDeleteReview={(review) =>
                      reviewDeleteMutation.mutate({ shopId: review.shopId, reviewId: review.id })
                    }
                    onReportReview={openReportReviewNotice}
                    onToggleReviewLike={(review, nextLiked) =>
                      reviewLikeMutation.mutate({ shopId: review.shopId, reviewId: review.id, nextLiked })
                    }
                    onShowReviewFromPhoto={() => setDetailTab('review')}
                  />
                </div>
              </div>
            </section>
          ) : null}

          {detailShop && sheetMode === 'review' ? (
            <MapReviewStation
              key={editingReview == null ? `create-${detailShop.id}` : `edit-${editingReview.id}`}
              shop={detailShop}
              review={editingReview}
              errorMessage={
                editingReview != null
                  ? reviewUpdateMutation.error instanceof Error
                    ? reviewUpdateMutation.error.message
                    : null
                  : reviewCreateMutation.error instanceof Error
                    ? reviewCreateMutation.error.message
                    : null
              }
              isSubmitting={reviewCreateMutation.isPending || reviewUpdateMutation.isPending}
              onSubmit={(payload) => {
                if (editingReview != null) {
                  reviewUpdateMutation.mutate({
                    shopId: detailShop.id,
                    reviewId: editingReview.id,
                    payload,
                  })
                  return
                }

                reviewCreateMutation.mutate({ shopId: detailShop.id, payload: payload as CreateShopReviewPayload })
              }}
            />
          ) : null}
        </div>
      </section>
    </main>
  )
}
