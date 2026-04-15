import { useMemo, useState } from 'react'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { getShops } from '../shared/api/shops'
import { formatRelativeUpdated } from '../shared/lib/format'
import {
  calculateDistanceKm,
  formatDistanceLabel,
  requestCurrentLocation,
  type UserLocation,
} from '../shared/lib/location'
import { ShopMap } from '../shared/ui/ShopMap'
import { StatusPill } from '../shared/ui/StatusPill'

const PAGE_SIZE = 10
const EMPTY_SHOPS = []

type FocusMode = 'shops' | 'shop' | 'user'

export function ExplorePage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const page = Number(searchParams.get('page') ?? '0')
  const category = searchParams.get('category') ?? ''
  const regionId = Number(searchParams.get('regionId') ?? '') || undefined
  const [activeShopId, setActiveShopId] = useState<number | null>(null)
  const [filtersExpanded, setFiltersExpanded] = useState(false)
  const [focusMode, setFocusMode] = useState<FocusMode>('shops')
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null)
  const [locationState, setLocationState] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle')
  const [locationError, setLocationError] = useState<string | null>(null)

  const shopsQuery = useQuery({
    queryKey: ['shops', 'explore-map', page, category, regionId],
    queryFn: () =>
      getShops({
        page,
        size: PAGE_SIZE,
        category: category || undefined,
        regionId,
      }),
    placeholderData: keepPreviousData,
  })

  const facetQuery = useQuery({
    queryKey: ['shops', 'explore-map-facets'],
    queryFn: () => getShops({ page: 0, size: 200 }),
  })

  const shops = useMemo(() => shopsQuery.data?.content ?? EMPTY_SHOPS, [shopsQuery.data?.content])
  const allShops = useMemo(() => facetQuery.data?.content ?? EMPTY_SHOPS, [facetQuery.data?.content])

  const mappableShops = useMemo(
    () => shops.filter((shop) => Number.isFinite(shop.px) && Number.isFinite(shop.py)),
    [shops],
  )

  const categories = useMemo(
    () => Array.from(new Set(allShops.flatMap((shop) => shop.categories))).slice(0, 8),
    [allShops],
  )

  const regions = useMemo(() => {
    const entries = new Map<number, { id: number; name: string; shopCount: number }>()

    for (const shop of allShops) {
      if (!shop.regionId || !shop.regionName) {
        continue
      }

      const current = entries.get(shop.regionId) ?? {
        id: shop.regionId,
        name: shop.regionName,
        shopCount: 0,
      }

      current.shopCount += 1
      entries.set(shop.regionId, current)
    }

    return Array.from(entries.values()).sort((a, b) => b.shopCount - a.shopCount)
  }, [allShops])

  const shopsWithDistance = useMemo(() => {
    return shops.map((shop) => {
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
  }, [shops, userLocation])

  const effectiveActiveShopId =
    activeShopId != null && shopsWithDistance.some((shop) => shop.id === activeShopId)
      ? activeShopId
      : shopsWithDistance[0]?.id ?? null

  const activeShop =
    (effectiveActiveShopId != null
      ? shopsWithDistance.find((shop) => shop.id === effectiveActiveShopId) ?? null
      : null) ?? null

  const setFilter = (key: 'category' | 'regionId', value?: string) => {
    const next = new URLSearchParams(searchParams)
    next.set('page', '0')

    if (value) {
      next.set(key, value)
    } else {
      next.delete(key)
    }

    setSearchParams(next)
    setFocusMode('shops')
  }

  const movePage = (nextPage: number) => {
    const next = new URLSearchParams(searchParams)
    next.set('page', String(nextPage))
    setSearchParams(next)
    setFocusMode('shops')
  }

  const handleSelectShop = (shopId: number) => {
    setActiveShopId(shopId)
    setFocusMode('shop')
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
      setFocusMode('user')
    } catch (error) {
      setLocationState('error')
      setLocationError(error instanceof Error ? error.message : '현재 위치를 가져오지 못했습니다.')
    }
  }

  return (
    <main className="app-shell map-explore-shell map-explore-shell-immersive">
      <section className="map-stage">
        <div className="map-stage-search">
          <button className="search-entry-button map-search-entry" type="button" onClick={() => navigate('/search')}>
            <span>매장명, 작품명, 지역으로 검색</span>
            <strong>⌕</strong>
          </button>
        </div>

        <div className="map-stage-body">
          <div className="map-surface map-surface-large map-surface-immersive">
            <div className="map-overlay-top">
              <div className="map-overlay-row">
                <button className="map-fab" type="button" onClick={handleRequestLocation}>
                  {locationState === 'loading' ? '위치 확인 중…' : '내 위치'}
                </button>
                <button className="map-fab" type="button" onClick={() => setFiltersExpanded((current) => !current)}>
                  {filtersExpanded ? '필터 닫기' : '필터'}
                </button>
              </div>

              <div className="map-overlay-row map-overlay-chips">
                {regionId ? (
                  <button
                    className="mini-tag map-chip-button"
                    type="button"
                    onClick={() => setFilter('regionId')}
                  >
                    {regions.find((item) => item.id === regionId)?.name ?? `지역 ${regionId}`}
                  </button>
                ) : (
                  <button className="mini-tag map-chip-button" type="button" onClick={() => setFiltersExpanded(true)}>
                    전체 지역
                  </button>
                )}
                {category ? (
                  <button
                    className="mini-tag map-chip-button"
                    type="button"
                    onClick={() => setFilter('category')}
                  >
                    {category}
                  </button>
                ) : (
                  <button className="mini-tag map-chip-button" type="button" onClick={() => setFiltersExpanded(true)}>
                    전체 카테고리
                  </button>
                )}
                {userLocation ? <span className="mini-tag">내 위치</span> : null}
              </div>
            </div>

            {filtersExpanded ? (
              <div className="map-floating-panel map-filter-sheet">
                <div className="map-floating-head">
                  <strong>필터</strong>
                  <button className="ghost-action compact-action" type="button" onClick={() => setFiltersExpanded(false)}>
                    닫기
                  </button>
                </div>
                <div className="filter-panel map-floating-filters">
                  <div className="chip-row">
                    <button className={`filter-chip ${regionId ? '' : 'chip-active'}`} type="button" onClick={() => setFilter('regionId')}>
                      전체 지역
                    </button>
                    {regions.map(({ id, name }) => (
                      <button
                        className={`filter-chip ${regionId === id ? 'chip-active' : ''}`}
                        key={id}
                        type="button"
                        onClick={() => setFilter('regionId', String(id))}
                      >
                        {name}
                      </button>
                    ))}
                  </div>
                  <div className="chip-row">
                    <button className={`filter-chip ${category ? '' : 'chip-active'}`} type="button" onClick={() => setFilter('category')}>
                      전체 카테고리
                    </button>
                    {categories.map((item) => (
                      <button
                        className={`filter-chip ${category === item ? 'chip-active' : ''}`}
                        key={item}
                        type="button"
                        onClick={() => setFilter('category', item)}
                      >
                        {item}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : null}

            <ShopMap
              shops={mappableShops}
              activeShopId={effectiveActiveShopId}
              onSelectShop={handleSelectShop}
              userLocation={userLocation}
              focusMode={effectiveActiveShopId === activeShopId ? focusMode : 'shops'}
            />

            <div className="map-overlay-bottom">
              {activeShop ? (
                <article className="map-bottom-preview">
                  <div className="map-bottom-preview-head">
                    <div>
                      <strong>{activeShop.name}</strong>
                      <p>
                        {activeShop.regionName ?? `지역 ${activeShop.regionId ?? '-'}`} · 작품 {activeShop.works.length}
                      </p>
                    </div>
                    <StatusPill status={activeShop.status} />
                  </div>
                  <p className="map-focus-meta">
                    {activeShop.distanceLabel ? `${activeShop.distanceLabel} · ` : ''}
                    {formatRelativeUpdated(activeShop.updatedAt)}
                  </p>
                  <div className="shop-action-group">
                    <button className="ghost-action compact-action" type="button" onClick={() => setFocusMode('shop')}>
                      지도 고정
                    </button>
                    <Link className="primary-action compact-action" to={`/shops/${activeShop.id}`}>
                      상세 보기
                    </Link>
                  </div>
                </article>
              ) : null}

              <div className="map-inline-rail-wrap">
                <div className="map-inline-rail-header">
                  <strong>현재 결과</strong>
                  <span className="meta-text">
                    {page + 1} / {Math.max(1, shopsQuery.data?.totalPages ?? 1)}
                  </span>
                </div>
                <div className="map-result-rail" aria-label="현재 결과 목록">
                  {shopsWithDistance.map((shop) => (
                    <article className={`shop-rail-card ${effectiveActiveShopId === shop.id ? 'shop-rail-card-active' : ''}`} key={shop.id}>
                      <div className="shop-item-head">
                        <strong>{shop.name}</strong>
                        <StatusPill status={shop.status} />
                      </div>
                      <p className="shop-item-summary">
                        {shop.regionName ?? `지역 ${shop.regionId ?? '-'}`} · 작품 {shop.works.length} · 링크 {shop.links.length}
                      </p>
                      <p className="shop-item-meta">
                        {shop.distanceLabel ? `${shop.distanceLabel} · ` : ''}
                        {formatRelativeUpdated(shop.updatedAt)}
                      </p>
                      <div className="shop-action-group">
                        <button className="ghost-action compact-action" type="button" onClick={() => handleSelectShop(shop.id)}>
                          보기
                        </button>
                        <Link className="primary-action compact-action" to={`/shops/${shop.id}`}>
                          상세
                        </Link>
                      </div>
                    </article>
                  ))}
                </div>

                {shopsQuery.data ? (
                  <div className="pagination-row map-pagination-row">
                    <button className="ghost-action compact-action" disabled={page === 0} type="button" onClick={() => movePage(page - 1)}>
                      이전
                    </button>
                    <button className="ghost-action compact-action" disabled={shopsQuery.data.last} type="button" onClick={() => movePage(page + 1)}>
                      다음
                    </button>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </div>

        {locationError ? <p className="error-text map-inline-error">{locationError}</p> : null}
      </section>
    </main>
  )
}
