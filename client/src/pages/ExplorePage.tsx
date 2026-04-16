import { type ReactNode, type UIEvent, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { getShop, getShops } from '../shared/api/shops'
import type { Shop } from '../shared/api/types'
import { formatRelativeUpdated, linkTypeToLabel, statusToLabel } from '../shared/lib/format'
import {
  calculateDistanceKm,
  formatDistanceLabel,
  requestCurrentLocation,
  type UserLocation,
} from '../shared/lib/location'
import { ShopMap } from '../shared/ui/ShopMap'
import { StatusPill } from '../shared/ui/StatusPill'

const PAGE_SIZE = 10
const MAP_FETCH_SIZE = 200
const EMPTY_SHOPS: Shop[] = []

type FocusMode = 'shops' | 'shop' | 'user' | 'idle'
type ViewMode = 'map' | 'list'
type SheetMode = 'peek' | 'expanded'
type SelectionOrigin = 'map' | 'list' | null

type DetailIconName = 'pin' | 'clock' | 'layers' | 'tag' | 'link'

function MapDetailIcon({ name }: { name: DetailIconName }) {
  const commonProps = {
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.9,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
  }

  switch (name) {
    case 'pin':
      return (
        <svg {...commonProps}>
          <path d="M12 21s-5.25-5.1-5.25-9.55A5.25 5.25 0 1 1 17.25 11.45C17.25 15.9 12 21 12 21Z" />
          <circle cx="12" cy="11.25" r="1.9" />
        </svg>
      )
    case 'clock':
      return (
        <svg {...commonProps}>
          <circle cx="12" cy="12" r="8" />
          <path d="M12 7.8v4.8l3.1 1.9" />
        </svg>
      )
    case 'layers':
      return (
        <svg {...commonProps}>
          <path d="m12 5 7 3.8-7 3.7-7-3.7L12 5Z" />
          <path d="m5 12.6 7 3.8 7-3.8" />
          <path d="m5 16.2 7 3.8 7-3.8" />
        </svg>
      )
    case 'tag':
      return (
        <svg {...commonProps}>
          <path d="M20 10.6 13.6 17a2 2 0 0 1-2.8 0L4.9 11.1V5h6.1L17 10.8a2 2 0 0 1 0 2.8Z" />
          <circle cx="8.1" cy="8.1" r="1.1" />
        </svg>
      )
    case 'link':
      return (
        <svg {...commonProps}>
          <path d="M10.3 13.7 8.2 15.8a3 3 0 1 1-4.2-4.2l2.8-2.8a3 3 0 0 1 4.2 0" />
          <path d="M13.7 10.3 15.8 8.2a3 3 0 1 1 4.2 4.2l-2.8 2.8a3 3 0 0 1-4.2 0" />
          <path d="m9 15 6-6" />
        </svg>
      )
    default:
      return null
  }
}

function MapDetailRow({
  icon,
  label,
  children,
}: {
  icon: DetailIconName
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
  const category = searchParams.get('category') ?? ''
  const regionId = Number(searchParams.get('regionId') ?? '') || undefined
  const selectedShopId = Number(searchParams.get('shopId') ?? '') || null
  const [focusMode, setFocusMode] = useState<FocusMode>(selectedShopId ? 'shop' : 'shops')
  const [focusRequestId, setFocusRequestId] = useState(1)
  const [viewMode, setViewMode] = useState<ViewMode>('map')
  const [sheetMode, setSheetMode] = useState<SheetMode>(selectedShopId ? 'peek' : 'peek')
  const [selectionOrigin, setSelectionOrigin] = useState<SelectionOrigin>(selectedShopId ? 'map' : null)
  const [visibleListCount, setVisibleListCount] = useState(PAGE_SIZE)
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null)
  const [locationState, setLocationState] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle')
  const [locationError, setLocationError] = useState<string | null>(null)
  const listScrollRef = useRef<HTMLDivElement | null>(null)
  const listScrollTopRef = useRef(0)
  const listVisibleCountRef = useRef(PAGE_SIZE)
  const pendingListRestoreRef = useRef(false)

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

  const allShops = useMemo(() => shopsQuery.data?.content ?? EMPTY_SHOPS, [shopsQuery.data?.content])

  const categories = useMemo(
    () => Array.from(new Set(allShops.flatMap((shop) => shop.categories))).slice(0, 8),
    [allShops],
  )

  const filteredShops = useMemo(() => {
    return allShops.filter((shop) => {
      if (regionId && shop.regionId !== regionId) {
        return false
      }

      if (category && !shop.categories.includes(category)) {
        return false
      }

      return true
    })
  }, [allShops, category, regionId])

  const shopsWithDistance = useMemo(() => {
    return filteredShops.map((shop) => {
      if (!userLocation || !Number.isFinite(shop.px) || !Number.isFinite(shop.py)) {
        return { ...shop, distanceLabel: null }
      }

      const distanceKm = calculateDistanceKm(userLocation, {
        latitude: shop.py,
        longitude: shop.px,
      })

      return {
        ...shop,
        distanceLabel: formatDistanceLabel(distanceKm),
      }
    })
  }, [filteredShops, userLocation])

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

  const syncSearchParams = (next: URLSearchParams) => {
    setSearchParams(next, { replace: true })
  }

  const requestMapFocus = (mode: FocusMode) => {
    setFocusMode(mode)
    setFocusRequestId((current) => current + 1)
  }

  const setFilter = (value?: string) => {
    const next = new URLSearchParams(searchParams)
    next.delete('shopId')

    if (value) {
      next.set('category', value)
    } else {
      next.delete('category')
    }

    syncSearchParams(next)
    setVisibleListCount(PAGE_SIZE)
    setSheetMode('peek')
    requestMapFocus('shops')
  }

  const handleSelectShop = (
    shopId: number,
    origin: Exclude<SelectionOrigin, null>,
    nextSheetMode: SheetMode = 'peek',
  ) => {
    const next = new URLSearchParams(searchParams)
    next.set('shopId', String(shopId))

    syncSearchParams(next)
    setSelectionOrigin(origin)
    setSheetMode(nextSheetMode)
    requestMapFocus('shop')
    setViewMode('map')
  }

  const restoreListView = () => {
    const next = new URLSearchParams(searchParams)
    next.delete('shopId')
    syncSearchParams(next)
    pendingListRestoreRef.current = true
    setVisibleListCount(Math.max(PAGE_SIZE, listVisibleCountRef.current))
    setSheetMode('peek')
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
    setFocusMode('idle')
    setViewMode('map')
    setSelectionOrigin(null)
  }

  const handleSwitchView = (nextView: ViewMode) => {
    if (nextView === 'map' && isListSheetOpen) {
      listScrollTopRef.current = listScrollRef.current?.scrollTop ?? 0
      listVisibleCountRef.current = visibleListCount
    }

    setViewMode(nextView)
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

  const shopsError = shopsQuery.isError ? (shopsQuery.error as Error).message : null
  const detailError = activeShopDetailQuery.isError ? (activeShopDetailQuery.error as Error).message : null
  const primaryLink = detailShop?.links[0] ?? null
  const isListSheetOpen = viewMode === 'list' && !detailShop

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

  useLayoutEffect(() => {
    if (!isListSheetOpen || !pendingListRestoreRef.current || !listScrollRef.current) {
      return
    }

    listScrollRef.current.scrollTop = listScrollTopRef.current
    pendingListRestoreRef.current = false
  }, [isListSheetOpen, visibleListCount])

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

  const topSearch = (
    <button className="map-search-field" type="button" onClick={() => navigate('/search')}>
      <span className="map-search-field-copy">매장, 작품, 지역 검색</span>
      <strong aria-hidden="true">⌕</strong>
    </button>
  )

  const chipToolbar = (
    <div className="map-chip-toolbar">
      <div className="map-chip-scroll" role="tablist" aria-label="카테고리 필터">
        <button
          className={`map-chip-filter ${category ? '' : 'map-chip-filter-active'}`}
          type="button"
          onClick={() => setFilter()}
        >
          전체
        </button>
        {categories.map((item) => (
          <button
            className={`map-chip-filter ${category === item ? 'map-chip-filter-active' : ''}`}
            key={item}
            type="button"
            onClick={() => setFilter(item)}
          >
            {item}
          </button>
        ))}
      </div>

      <button
        className={`map-chip-gps ${locationState === 'ready' ? 'map-chip-gps-active' : ''}`}
        type="button"
        onClick={handleRequestLocation}
        aria-label="현재 위치 보기"
      >
        {locationState === 'loading' ? (
          <span className="map-chip-gps-spinner" aria-hidden="true" />
        ) : (
          <span className="map-chip-gps-icon" aria-hidden="true">
            <span className="map-chip-gps-crosshair" />
          </span>
        )}
      </button>
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
              userLocation={userLocation}
              focusMode={focusMode}
              focusRequestId={focusRequestId}
              selectionOrigin={selectionOrigin}
            />
          )}

          <div
            className={`map-explore-top ${sheetMode === 'expanded' || isListSheetOpen ? 'map-explore-top-hidden' : ''}`}
          >
            {topSearch}
            {chipToolbar}

            {locationError ? <p className="error-text map-inline-error map-inline-error-overlay">{locationError}</p> : null}
            {shopsError ? <p className="error-text map-inline-error map-inline-error-overlay">{shopsError}</p> : null}
          </div>

          {!detailShop ? (
            <button
              className="map-list-fab"
              type="button"
              onClick={() => handleSwitchView(isListSheetOpen ? 'map' : 'list')}
            >
              {isListSheetOpen ? '지도 보기' : '목록 보기'}
            </button>
          ) : null}

          {isListSheetOpen ? (
            <section className="map-results-sheet-v2" aria-label="검색 결과 목록">
              <div className="map-results-sheet-top">
                {topSearch}
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
                selectionOrigin === 'list' ? 'map-bottom-sheet-peek-static' : '',
              ]
                .filter(Boolean)
                .join(' ')}
              aria-label={`${detailShop.name} 요약 정보`}
            >
              <button className="map-sheet-peek-trigger" type="button" onClick={() => setSheetMode('expanded')}>
                <span className="map-bottom-sheet-handle" />
              </button>

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
              </div>
            </section>
          ) : null}

          {detailShop && sheetMode === 'expanded' ? (
            <section className="map-bottom-sheet map-bottom-sheet-expanded" aria-label={`${detailShop.name} 상세 정보`}>
              <div className="map-sheet-expanded-header">
                <button className="map-sheet-icon-button" type="button" onClick={handleExpandedBack} aria-label="뒤로 가기">
                  ←
                </button>
                <div className="map-sheet-header-copy">
                  <strong>{detailShop.name}</strong>
                  <span>장소 정보</span>
                </div>
              </div>

              <div className="map-sheet-expanded-body">
                <div className="app-shell map-sheet-shell">
                  {detailError ? <p className="section error-text">{detailError}</p> : null}

                  <section className="section map-sheet-summary-card map-sheet-summary-card-compact">
                    <div className="map-sheet-summary-head map-sheet-summary-head-compact">
                      <div className="map-sheet-summary-copy">
                        <span className="eyebrow">{detailShop.regionName ?? `지역 ${detailShop.regionId ?? '-'}`}</span>
                        <h1>{detailShop.name}</h1>
                        {detailShop.description ? <p>{detailShop.description}</p> : null}
                      </div>
                      <StatusPill status={detailShop.status} />
                    </div>

                    <div className="map-sheet-summary-meta">
                      <span>{detailShop.floor ? `${detailShop.floor}층` : '층 정보 미등록'}</span>
                      <span>
                        {detailShop.categories.length > 0 ? detailShop.categories.join(' · ') : '카테고리 미등록'}
                      </span>
                    </div>

                    <div className="map-sheet-action-row">
                      {primaryLink ? (
                        <a className="map-sheet-action-pill" href={primaryLink.url} rel="noreferrer" target="_blank">
                          <MapDetailIcon name="link" />
                          <span>공식 링크</span>
                        </a>
                      ) : null}
                      <Link className="map-sheet-action-pill" to="/community">
                        <MapDetailIcon name="tag" />
                        <span>후기 보기</span>
                      </Link>
                    </div>
                  </section>

                  <section className="section map-sheet-info-list-v2 map-sheet-info-list-v3">
                    <MapDetailRow icon="pin" label="주소">
                      {detailShop.address}
                    </MapDetailRow>
                    <MapDetailRow icon="layers" label="운영 정보">
                      {detailShop.floor ? `${detailShop.floor}층 매장` : '층 정보 확인 필요'} · {statusToLabel(detailShop.status)}
                    </MapDetailRow>
                    <MapDetailRow icon="tag" label="취급 / 분류">
                      {detailShop.works.length > 0
                        ? `${detailShop.works.slice(0, 4).join(' · ')}${detailShop.works.length > 4 ? ` 외 ${detailShop.works.length - 4}개` : ''}`
                        : detailShop.categories.length > 0
                          ? detailShop.categories.join(' · ')
                          : '등록된 작품 정보 없음'}
                    </MapDetailRow>
                    <MapDetailRow icon="clock" label="업데이트">
                      {formatRelativeUpdated(detailShop.updatedAt)}
                      {activeShop?.distanceLabel ? ` · ${activeShop.distanceLabel}` : ''}
                    </MapDetailRow>
                  </section>

                  {detailShop.description ? (
                    <section className="section map-sheet-description-card">
                      <div className="map-sheet-section-head">
                        <strong>매장 설명</strong>
                      </div>
                      <p className="map-sheet-description-text">{detailShop.description}</p>
                    </section>
                  ) : null}

                  {detailShop.works.length > 0 ? (
                    <section className="section map-sheet-list-card">
                      <div className="map-sheet-section-head">
                        <strong>취급 작품</strong>
                        <span>{detailShop.works.length}개</span>
                      </div>
                      <ul className="map-sheet-bullet-list">
                        {detailShop.works.slice(0, 8).map((work) => (
                          <li key={work}>{work}</li>
                        ))}
                      </ul>
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





