import { type FormEvent, useMemo, useState } from 'react'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { getShops } from '../shared/api/shops'
import { pushRecentSearch, readRecentSearches } from '../shared/lib/searchHistory'
import { formatRelativeUpdated } from '../shared/lib/format'
import { StatusPill } from '../shared/ui/StatusPill'

const SEARCH_PAGE_SIZE = 8

export function SearchPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const currentKeyword = searchParams.get('keyword') ?? ''
  const currentPage = Number(searchParams.get('page') ?? '0')
  const [keyword, setKeyword] = useState(currentKeyword)
  const [recentSearches, setRecentSearches] = useState(() => readRecentSearches())

  const facetQuery = useQuery({
    queryKey: ['shops', 'search-page-facets'],
    queryFn: () => getShops({ page: 0, size: 200 }),
  })

  const resultQuery = useQuery({
    queryKey: ['shops', 'search-page-results', currentKeyword, currentPage],
    queryFn: () =>
      getShops({
        page: currentPage,
        size: SEARCH_PAGE_SIZE,
        keyword: currentKeyword || undefined,
      }),
    placeholderData: keepPreviousData,
    enabled: currentKeyword.trim().length > 0,
  })

  const allShops = useMemo(() => facetQuery.data?.content ?? [], [facetQuery.data?.content])

  const recommendedKeywords = useMemo(() => {
    const works = new Map<string, number>()

    for (const shop of allShops) {
      for (const work of shop.works) {
        works.set(work, (works.get(work) ?? 0) + 1)
      }
    }

    return Array.from(works.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([name]) => name)
  }, [allShops])

  const popularKeywords = useMemo(() => {
    const counts = new Map<string, number>()

    for (const shop of allShops) {
      for (const categoryName of shop.categories) {
        counts.set(categoryName, (counts.get(categoryName) ?? 0) + 1)
      }

      if (shop.regionName) {
        counts.set(shop.regionName, (counts.get(shop.regionName) ?? 0) + 1)
      }
    }

    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([name]) => name)
  }, [allShops])

  const moveToSearch = (nextKeyword: string, nextPage = 0) => {
    const trimmed = nextKeyword.trim()
    const next = new URLSearchParams()

    if (trimmed) {
      next.set('keyword', trimmed)
      setRecentSearches(pushRecentSearch(trimmed))
    }

    next.set('page', String(nextPage))
    setSearchParams(next)
    setKeyword(trimmed)
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    moveToSearch(keyword)
  }

  const movePage = (nextPage: number) => {
    moveToSearch(currentKeyword, nextPage)
  }

  return (
    <main className="app-shell search-focus-shell">
      <section className="section search-focus-panel">
        <div className="search-focus-top">
          <button className="icon-button" type="button" onClick={() => navigate(-1)} aria-label="이전으로">
            <span aria-hidden="true">←</span>
          </button>
          <div className="search-focus-header-copy">
            <h1>검색</h1>
            <p className="meta-text">매장명, 작품명, 지역으로 찾아보세요.</p>
          </div>
        </div>

        <form className="search-focus-form" onSubmit={handleSubmit}>
          <input
            autoFocus
            aria-label="검색어 입력"
            className="search-focus-input"
            placeholder="매장명, 작품명, 지역으로 검색"
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
          />
          <button className="icon-button search-submit-button" type="submit" aria-label="검색">
            <span aria-hidden="true">⌕</span>
          </button>
        </form>

        <section className="search-focus-section search-focus-section-tight">
          <div className="section-header search-focus-header-row">
            <h2>최근</h2>
            {recentSearches.length > 0 ? (
              <button className="text-link" type="button" onClick={() => setRecentSearches([])}>
                숨기기
              </button>
            ) : null}
          </div>
          {recentSearches.length > 0 ? (
            <div className="chip-row">
              {recentSearches.map((item) => (
                <button className="filter-chip" key={item} type="button" onClick={() => moveToSearch(item)}>
                  {item}
                </button>
              ))}
            </div>
          ) : (
            <p className="search-focus-empty">최근 검색어가 없습니다.</p>
          )}
        </section>

        <section className="search-focus-section search-focus-section-tight">
          <h2>추천</h2>
          <div className="search-rank-grid">
            {recommendedKeywords.map((item, index) => (
              <button className="search-rank-chip" key={item} type="button" onClick={() => moveToSearch(item)}>
                <span>{index + 1}</span>
                <strong>{item}</strong>
              </button>
            ))}
          </div>
        </section>

        <section className="search-focus-section search-focus-section-tight">
          <h2>인기 키워드</h2>
          <div className="search-inline-ranking">
            {popularKeywords.map((item, index) => (
              <button className="search-inline-item" key={item} type="button" onClick={() => moveToSearch(item)}>
                <span>{index + 1}</span>
                {item}
              </button>
            ))}
          </div>
        </section>

        {currentKeyword ? (
          <section className="search-focus-section search-result-section">
            <div className="section-header">
              <div>
                <h2>검색 결과</h2>
                <p className="meta-text">{resultQuery.data?.totalElements ?? 0}곳</p>
              </div>
              <Link className="text-link" to="/explore">
                지도 탐색
              </Link>
            </div>

            {resultQuery.isLoading ? <p>검색 결과를 불러오는 중입니다.</p> : null}
            {resultQuery.isError ? <p className="error-text">{(resultQuery.error as Error).message}</p> : null}
            {resultQuery.data?.content.length === 0 ? <p className="search-focus-empty">검색 결과가 없습니다.</p> : null}

            <div className="shop-list search-result-list">
              {(resultQuery.data?.content ?? []).map((shop) => (
                <article className="shop-item" key={shop.id}>
                  <div className="shop-item-head">
                    <strong>{shop.name}</strong>
                    <StatusPill status={shop.status} />
                  </div>
                  <p className="shop-item-summary">
                    {shop.regionName ?? `지역 ${shop.regionId ?? '-'}`} · 작품 {shop.works.length} · 링크 {shop.links.length}
                  </p>
                  <p className="shop-item-meta">{formatRelativeUpdated(shop.updatedAt)}</p>
                  <div className="shop-action-group">
                    <Link className="ghost-action compact-action" to={`/explore?page=0&regionId=${shop.regionId ?? ''}`}>
                      지도 보기
                    </Link>
                    <Link className="primary-action compact-action" to={`/shops/${shop.id}`}>
                      상세 보기
                    </Link>
                  </div>
                </article>
              ))}
            </div>

            {resultQuery.data ? (
              <div className="pagination-row">
                <button
                  className="ghost-action compact-action"
                  disabled={currentPage === 0}
                  type="button"
                  onClick={() => movePage(currentPage - 1)}
                >
                  이전
                </button>
                <button
                  className="ghost-action compact-action"
                  disabled={resultQuery.data.last}
                  type="button"
                  onClick={() => movePage(currentPage + 1)}
                >
                  다음
                </button>
              </div>
            ) : null}
          </section>
        ) : null}
      </section>
    </main>
  )
}
