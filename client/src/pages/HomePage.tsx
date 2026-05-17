import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link, useNavigate } from 'react-router-dom'
import homeQuickAdminIcon from '../assets/icons/home-quick-admin.webp'
import homeQuickReviewIcon from '../assets/icons/home-quick-review.webp'
import homeQuickStoreIcon from '../assets/icons/home-quick-store.webp'
import { getPosts } from '../shared/api/community'
import { getWorks } from '../shared/api/works'
import { formatDateTime } from '../shared/lib/format'
import { isAdminUnlocked } from '../shared/lib/adminAccess'
import {
  buildHomeQuickMenus,
  buildHomeReviewPreviewItems,
  buildHomeWorkPreviewItems,
  type HomeQuickMenu,
  type HomeReviewPreviewItem,
  type HomeWorkPreviewItem,
} from './homeViewModel'

function SearchIcon() {
  return (
    <svg aria-hidden="true" fill="none" viewBox="0 0 24 24">
      <circle cx="11" cy="11" r="6" />
      <path d="m16 16 4 4" />
    </svg>
  )
}

function HomeQuickMenuIcon({ icon }: { icon: HomeQuickMenu['icon'] }) {
  const iconSrc = icon === 'map' ? homeQuickStoreIcon : icon === 'admin' ? homeQuickAdminIcon : homeQuickReviewIcon

  return <img alt="" aria-hidden="true" className="home-quick-icon-image" src={iconSrc} />
}

function HomeSearchEntry({ onSearch }: { onSearch: () => void }) {
  return (
    <section className="section discover-search-entry-section" aria-label="매장 검색">
      <button className="map-search-field home-search-entry" type="button" onClick={onSearch}>
        <span className="map-search-field-copy">작품, 매장명, 지역으로 검색</span>
        <SearchIcon />
      </button>
    </section>
  )
}

function HomeQuickMenuSection({ menus }: { menus: HomeQuickMenu[] }) {
  return (
    <nav className="home-quick-menu" data-menu-count={menus.length} aria-label="홈 빠른 메뉴">
      {menus.map((menu) => (
        <Link className="home-quick-menu-item" key={menu.id} to={menu.href}>
          <span
            className={`home-quick-icon home-quick-icon-${menu.id}`}
            data-tds-asset-shape="squircle-background"
            data-tds-asset-size="medium"
            data-tds-icon-name={`home-${menu.icon}`}
          >
            <HomeQuickMenuIcon icon={menu.icon} />
          </span>
          <span>{menu.label}</span>
        </Link>
      ))}
    </nav>
  )
}

function HomePendingCard({ title, description }: { title: string; description: string }) {
  return (
    <article className="home-pending-card">
      <strong>{title}</strong>
      <small>{description}</small>
    </article>
  )
}

function HomeWorkPosterCard({ work }: { work: HomeWorkPreviewItem }) {
  return (
    <Link
      aria-label={`${work.name} 취급 매장 보기`}
      className="home-work-poster-card"
      state={{ returnTo: '/home' }}
      to={`/explore?workId=${work.id}&view=list`}
    >
      <span className="home-work-poster-art">
        {work.coverUrl ? (
          <img alt="" aria-hidden="true" src={work.coverUrl} />
        ) : (
          <span className="home-work-poster-empty" aria-hidden="true">
            {work.name.slice(0, 1)}
          </span>
        )}
        <span className="home-work-poster-badge">{work.badgeLabel}</span>
        <span className="home-work-poster-rank" data-rank-length={String(work.rank).length} aria-hidden="true">
          {work.rank}
        </span>
      </span>
      <strong className="home-work-poster-title">{work.name}</strong>
      {work.subtitle ? <small className="home-work-poster-subtitle">{work.subtitle}</small> : null}
    </Link>
  )
}

function HomeIssueSection({ works, isLoading, isError }: {
  works: HomeWorkPreviewItem[]
  isLoading: boolean
  isError: boolean
}) {
  return (
    <section aria-labelledby="home-issues-title" className="home-issue-section" id="home-issues">
      <div className="home-section-head">
        <h2 id="home-issues-title">인기 작품 TOP 20</h2>
      </div>
      {isLoading ? <HomePendingCard title="작품을 불러오는 중이에요" description="잠시만 기다려 주세요." /> : null}
      {isError ? <HomePendingCard title="작품을 불러오지 못했어요" description="검색으로 매장을 계속 찾을 수 있어요." /> : null}
      {!isLoading && !isError && works.length === 0 ? (
        <HomePendingCard title="연결된 작품이 아직 없어요" description="확인된 작품부터 보여드릴게요." />
      ) : null}
      {works.length > 0 ? (
        <div className="home-work-poster-rail">
          <div className="home-work-poster-carousel" aria-label="작품 포스터 가로 스크롤">
            {works.map((work) => (
              <HomeWorkPosterCard key={work.id} work={work} />
            ))}
          </div>
        </div>
      ) : null}
    </section>
  )
}

function HomeReviewCard({ post }: { post: HomeReviewPreviewItem }) {
  return (
    <Link className="home-review-card" to={`/community/${post.id}`}>
      <strong>{post.title}</strong>
      <p>{post.excerpt}</p>
      <small>
        {post.authorNickname} · {formatDateTime(post.createdAt)}
      </small>
    </Link>
  )
}

function HomeReviewPreviewSection({ posts, isLoading, isError }: {
  posts: HomeReviewPreviewItem[]
  isLoading: boolean
  isError: boolean
}) {
  return (
    <section aria-labelledby="home-review-preview-title" className="home-review-preview-section">
      <div className="home-section-head">
        <h2 id="home-review-preview-title">최근 방문 후기</h2>
      </div>
      {isLoading ? <HomePendingCard title="글을 불러오는 중이에요" description="잠시만 기다려 주세요." /> : null}
      {isError ? <HomePendingCard title="글을 불러오지 못했어요" description="커뮤니티에서 다시 확인할 수 있어요." /> : null}
      {!isLoading && !isError && posts.length === 0 ? (
        <HomePendingCard title="아직 올라온 글이 없어요" description="방문 이야기가 모이면 보여드릴게요." />
      ) : null}
      {posts.length > 0 ? (
        <div className="home-review-list">
          {posts.map((post) => (
            <HomeReviewCard key={post.id} post={post} />
          ))}
        </div>
      ) : null}
    </section>
  )
}

export function HomePage() {
  const navigate = useNavigate()
  const quickMenus = useMemo(() => buildHomeQuickMenus({ includeAdmin: isAdminUnlocked() }), [])
  const worksQuery = useQuery({
    queryKey: ['works', 'home-preview'],
    queryFn: getWorks,
    staleTime: 1000 * 60 * 10,
  })
  const postsQuery = useQuery({
    queryKey: ['posts', 'home-preview'],
    queryFn: () => getPosts({ page: 0, size: 2, sort: ['createdAt,desc'] }),
    staleTime: 1000 * 60 * 3,
  })
  const workItems = useMemo(
    () => buildHomeWorkPreviewItems(worksQuery.data ?? []),
    [worksQuery.data],
  )
  const reviewItems = useMemo(
    () => buildHomeReviewPreviewItems(postsQuery.data?.content ?? []),
    [postsQuery.data?.content],
  )

  return (
    <main className="app-shell discover-shell">
      <HomeSearchEntry onSearch={() => navigate('/search')} />
      <HomeQuickMenuSection menus={quickMenus} />
      <HomeIssueSection works={workItems} isLoading={worksQuery.isLoading} isError={worksQuery.isError} />
      <HomeReviewPreviewSection posts={reviewItems} isLoading={postsQuery.isLoading} isError={postsQuery.isError} />
    </main>
  )
}
