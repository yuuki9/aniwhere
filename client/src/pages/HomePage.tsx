import { type FormEvent, useMemo, useState } from 'react'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { Link, useSearchParams } from 'react-router-dom'
import { getPosts } from '../shared/api/community'
import { getShops } from '../shared/api/shops'
import { formatDateTime } from '../shared/lib/format'
import { ShopMap } from '../shared/ui/ShopMap'
import { StatusPill } from '../shared/ui/StatusPill'

const PAGE_SIZE = 20

export function HomePage() {
  const [flowStage, setFlowStage] = useState<'explore' | 'map'>('explore')
  const [showFullList, setShowFullList] = useState(false)
  const [searchParams, setSearchParams] = useSearchParams()
  const page = Number(searchParams.get('page') ?? '0')
  const category = searchParams.get('category') ?? ''
  const keyword = searchParams.get('keyword') ?? ''
  const regionId = Number(searchParams.get('regionId') ?? '') || undefined
  const [keywordInput, setKeywordInput] = useState(keyword)
  const [activeShopId, setActiveShopId] = useState<number | null>(null)

  const shopsQuery = useQuery({
    queryKey: ['shops', page, category, keyword, regionId],
    queryFn: () =>
      getShops({
        page,
        size: PAGE_SIZE,
        category: category || undefined,
        keyword: keyword || undefined,
        regionId,
      }),
    placeholderData: keepPreviousData,
  })

  const facetQuery = useQuery({
    queryKey: ['shops', 'facets'],
    queryFn: () => getShops({ page: 0, size: 200 }),
  })

  const postsQuery = useQuery({
    queryKey: ['posts', 'preview'],
    queryFn: () => getPosts({ page: 0, size: 4 }),
  })

  const shops = shopsQuery.data?.content ?? []
  const mappableShops = shops.filter((shop) => Number.isFinite(shop.px) && Number.isFinite(shop.py))
  const activeShop =
    mappableShops.find((shop) => shop.id === activeShopId) ?? mappableShops[0] ?? shops[0] ?? null

  const featuredShops = useMemo(() => {
    const scored = [...shops].sort((a, b) => {
      const aScore = (a.status === 'ACTIVE' ? 2 : 0) + a.links.length + a.works.length
      const bScore = (b.status === 'ACTIVE' ? 2 : 0) + b.links.length + b.works.length
      return bScore - aScore
    })
    return scored.slice(0, 6)
  }, [shops])

  const categories = useMemo(
    () =>
      Array.from(new Set((facetQuery.data?.content ?? []).flatMap((shop) => shop.categories))),
    [facetQuery.data?.content],
  )

  const regions = useMemo(() => {
    const entries = new Map<number, string>()
    for (const shop of facetQuery.data?.content ?? []) {
      if (shop.regionId && shop.regionName) {
        entries.set(shop.regionId, shop.regionName)
      }
    }
    return Array.from(entries.entries())
  }, [facetQuery.data?.content])

  const submitSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const next = new URLSearchParams(searchParams)
    next.set('page', '0')
    if (keywordInput.trim()) {
      next.set('keyword', keywordInput.trim())
    } else {
      next.delete('keyword')
    }
    setSearchParams(next)
  }

  const setFilter = (key: 'category' | 'regionId', value?: string) => {
    const next = new URLSearchParams(searchParams)
    next.set('page', '0')
    if (value) {
      next.set(key, value)
    } else {
      next.delete(key)
    }
    setSearchParams(next)
  }

  const movePage = (nextPage: number) => {
    const next = new URLSearchParams(searchParams)
    next.set('page', String(nextPage))
    setSearchParams(next)
  }

  return (
    <main className="app-shell">
      <section className="section intro">
        <div>
          <span className="eyebrow">DISCOVERY HALL</span>
          <h1>Curation first, map second</h1>
          <p>Compress choices with curation signals first, then open the map only for route decisions.</p>
        </div>
        <div className="intro-actions">
          <Link className="secondary-action compact-action" to="/community">
            Open Community
          </Link>
        </div>
      </section>

      <section className="section impact-banner">
        <div className="impact-copy">
          <span className="section-label">THIS WEEK</span>
          <h2>Most talked-about otaku routes</h2>
          <p>Ranked by active status, source links, and work coverage from current API responses.</p>
        </div>
        <button className="primary-action compact-action" type="button" onClick={() => setFlowStage('map')}>
          지도 2단계로 이동
        </button>
      </section>

      <section className="section search-panel">
        <form className="search-row" onSubmit={submitSearch}>
          <input
            aria-label="Shop search keyword"
            className="search-input"
            placeholder="Search by shop, district, title, or fandom keyword"
            value={keywordInput}
            onChange={(event) => setKeywordInput(event.target.value)}
          />
          <button className="primary-action compact-action" type="submit">
            Search
          </button>
        </form>
        <div className="chip-row">
          <button
            className={`filter-chip ${regionId ? '' : 'chip-active'}`}
            type="button"
            onClick={() => setFilter('regionId')}
          >
            All regions
          </button>
          {regions.map(([id, name]) => (
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
          <button
            className={`filter-chip ${category ? '' : 'chip-active'}`}
            type="button"
            onClick={() => setFilter('category')}
          >
            All categories
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
      </section>

      {flowStage === 'explore' ? (
        <>
          <section className="section hall-section">
            <div className="section-header">
              <div>
                <span className="section-label">CURATED PICKS</span>
                <h2>Hot picks right now</h2>
              </div>
              <button
                className="primary-action compact-action"
                type="button"
                onClick={() => setFlowStage('map')}
              >
                지도 보기
              </button>
            </div>
            <div className="hall-grid">
              {featuredShops.map((shop) => (
                <article className="hall-card" key={shop.id}>
                  <div className="shop-item-head">
                    <strong>{shop.name}</strong>
                    <StatusPill status={shop.status} />
                  </div>
                  <p>{shop.address}</p>
                  <div className="chip-row">
                    {(shop.categories.length > 0 ? shop.categories : ['Uncategorized'])
                      .slice(0, 3)
                      .map((cat) => (
                        <span className="mini-tag" key={`${shop.id}-${cat}`}>
                          {cat}
                        </span>
                      ))}
                  </div>
                  <div className="shop-row">
                    <span>Works {shop.works.length} · Links {shop.links.length}</span>
                    <Link className="text-link" to={`/shops/${shop.id}`}>
                      Detail
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="section detail-card">
            <div className="section-header">
              <div>
                <span className="section-label">RUMOR FEED</span>
                <h2>Community buzz preview</h2>
              </div>
              <Link className="text-link" to="/community">
                More
              </Link>
            </div>
            <div className="source-list">
              {postsQuery.data?.content.map((post) => (
                <Link className="source-card" key={post.id} to={`/community/${post.id}`}>
                  <strong>{post.title}</strong>
                  <p>{post.content}</p>
                  <p>
                    {post.authorNickname} · {formatDateTime(post.createdAt)} · Views {post.viewCount}
                  </p>
                </Link>
              ))}
            </div>
          </section>

          <section className="section list-card">
            <div className="section-header">
              <div>
                <span className="section-label">EXPLORE LIST</span>
                <h2>Full results (optional)</h2>
              </div>
              <button
                className="ghost-action compact-action"
                type="button"
                onClick={() => setShowFullList((prev) => !prev)}
              >
                {showFullList ? '목록 접기' : '전체 목록 보기'}
              </button>
            </div>
            {showFullList ? (
              <>
                {shopsQuery.isLoading ? <p>Loading shop data...</p> : null}
                {shopsQuery.isError ? (
                  <p className="error-text">{(shopsQuery.error as Error).message}</p>
                ) : null}
                <div className="shop-list">
                  {shops.map((shop) => (
                    <article className="shop-item" key={shop.id}>
                      <div className="shop-item-head">
                        <strong>{shop.name}</strong>
                        <StatusPill status={shop.status} />
                      </div>
                      <p>{shop.address}</p>
                      <div className="chip-row">
                        {(shop.categories.length > 0 ? shop.categories : ['Uncategorized'])
                          .slice(0, 3)
                          .map((cat) => (
                            <span className="mini-tag" key={`${shop.id}-${cat}`}>
                              {cat}
                            </span>
                          ))}
                      </div>
                      <div className="shop-row">
                        <span>{shop.regionName ?? `Region ${shop.regionId ?? '-'}`}</span>
                        <div className="shop-actions-inline">
                          <button
                            className="text-link"
                            type="button"
                            onClick={() => {
                              setActiveShopId(shop.id)
                              setFlowStage('map')
                            }}
                          >
                            지도에서 보기
                          </button>
                          <Link className="text-link" to={`/shops/${shop.id}`}>
                            Detail
                          </Link>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
                {shopsQuery.data ? (
                  <div className="pagination-row">
                    <button
                      className="ghost-action compact-action"
                      disabled={page === 0}
                      type="button"
                      onClick={() => movePage(page - 1)}
                    >
                      Prev
                    </button>
                    <button
                      className="ghost-action compact-action"
                      disabled={shopsQuery.data.last}
                      type="button"
                      onClick={() => movePage(page + 1)}
                    >
                      Next
                    </button>
                  </div>
                ) : null}
              </>
            ) : (
              <p>Keep the hall focused. Open full list only when you need deeper comparison.</p>
            )}
          </section>
        </>
      ) : null}

      {flowStage === 'map' ? (
        <section className="explorer-layout layout-map">
          <article className="section map-card">
            <div className="section-header">
              <div>
                <span className="section-label">MAP STAGE 2</span>
                <h2>Route and cluster check</h2>
              </div>
              <button
                className="ghost-action compact-action"
                type="button"
                onClick={() => setFlowStage('explore')}
              >
                탐색으로 돌아가기
              </button>
            </div>
            <div className="map-surface">
              <ShopMap
                shops={mappableShops}
                activeShopId={activeShop?.id ?? null}
                onSelectShop={setActiveShopId}
              />
            </div>
            {activeShop ? (
              <div className="map-focus-card">
                <div>
                  <strong>{activeShop.name}</strong>
                  <p>{activeShop.address}</p>
                </div>
                <StatusPill status={activeShop.status} />
              </div>
            ) : null}
          </article>

          <article className="section list-card">
            <div className="section-header">
              <div>
                <span className="section-label">MAP-LINKED LIST</span>
                <h2>Selected spots</h2>
              </div>
              <span className="meta-text">{shopsQuery.data?.totalElements ?? 0} spots</span>
            </div>
            <div className="shop-list">
              {shops.map((shop) => (
                <article
                  className={`shop-item ${activeShop?.id === shop.id ? 'shop-item-active' : ''}`}
                  key={shop.id}
                >
                  <div className="shop-item-head">
                    <button
                      aria-label={`Highlight ${shop.name} on map`}
                      className="text-link"
                      type="button"
                      onClick={() => setActiveShopId(shop.id)}
                    >
                      {shop.name}
                    </button>
                    <StatusPill status={shop.status} />
                  </div>
                  <p>{shop.address}</p>
                  <div className="shop-row">
                    <span>{shop.regionName ?? `Region ${shop.regionId ?? '-'}`}</span>
                    <Link className="text-link" to={`/shops/${shop.id}`}>
                      Detail
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          </article>
        </section>
      ) : null}
    </main>
  )
}
