import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { createPost, getPosts } from '../shared/api/community'
import { formatDateTime } from '../shared/lib/format'
import { GlobalNavigationMenu } from '../shared/ui/GlobalNavigationMenu'

export function CommunityPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [searchParams, setSearchParams] = useSearchParams()
  const page = Number(searchParams.get('page') ?? '0')
  const [title, setTitle] = useState('')
  const [author, setAuthor] = useState('')
  const [content, setContent] = useState('')

  const postsQuery = useQuery({
    queryKey: ['posts', page],
    queryFn: () => getPosts({ page, size: 12 }),
    placeholderData: keepPreviousData,
  })

  const postMutation = useMutation({
    mutationFn: createPost,
    onSuccess: () => {
      setTitle('')
      setAuthor('')
      setContent('')
      queryClient.invalidateQueries({ queryKey: ['posts'] })
    },
  })

  const latestPosts = useMemo(() => postsQuery.data?.content ?? [], [postsQuery.data?.content])
  const featuredTopics = useMemo(() => {
    const terms = new Map<string, number>()

    for (const post of latestPosts) {
      for (const token of post.title.split(/\s+/)) {
        const normalized = token.trim()
        if (normalized.length < 2) {
          continue
        }
        terms.set(normalized, (terms.get(normalized) ?? 0) + 1)
      }
    }

    return Array.from(terms.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
      .map(([term]) => term)
  }, [latestPosts])

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    postMutation.mutate({
      title,
      authorNickname: author,
      content,
    })
  }

  return (
    <main className="app-shell">
      <section className="section discover-search-entry-section">
        <div className="map-search-row">
          <GlobalNavigationMenu triggerClassName="global-nav-trigger global-nav-trigger-inline" />
          <button className="map-search-field" type="button" onClick={() => navigate('/search')}>
            <span className="map-search-field-copy">매장명, 작품명, 지역으로 검색</span>
            <strong aria-hidden="true">⌕</strong>
          </button>
        </div>
      </section>

      <section className="section editorial-hero">
        <div className="hero-copy">
          <span className="eyebrow">COMMUNITY</span>
          <h1>후기와 제보가 매장을 더 믿을 수 있게</h1>
          <p>
            방문 후기, 이전/휴무 제보, 굿즈 입고 정보처럼 실제 탐색에 도움이 되는 내용을 빠르게
            남길 수 있도록 구성합니다.
          </p>
          <div className="hero-action-row">
            <Link className="primary-action" to="/home">
              샵 탐색으로 돌아가기
            </Link>
            <a className="secondary-action" href="#post-composer">
              글 작성하기
            </a>
          </div>
        </div>

        <div className="hero-side-panel">
          <div className="hero-stat-card">
            <span className="section-label">실시간 흐름</span>
            <strong>{postsQuery.data?.totalElements ?? 0}개 게시글</strong>
            <p>최근 제보와 방문 후기를 기준으로 커뮤니티 피드를 구성하고 있어요.</p>
          </div>
          <div className="hero-stat-card hero-stat-card-accent">
            <span className="section-label">자주 나오는 키워드</span>
            <div className="chip-row">
              {(featuredTopics.length > 0 ? featuredTopics : ['홍대', '가챠', '신규 굿즈']).map((item) => (
                <span className="mini-tag" key={item}>
                  {item}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="explorer-layout layout-community">
        <article className="section detail-card composer-panel" id="post-composer">
          <div className="section-header">
            <div>
              <span className="section-label">WRITE</span>
              <h2>탐색에 도움이 되는 정보 남기기</h2>
            </div>
          </div>
          <div className="chip-row">
            {['방문 후기', '휴무 제보', '이전 정보', '굿즈 입고'].map((item) => (
              <span className="mini-tag" key={item}>
                {item}
              </span>
            ))}
          </div>
          <form className="form-mock" onSubmit={submit}>
            <input
              className="text-input"
              placeholder="제목"
              required
              value={title}
              onChange={(event) => setTitle(event.target.value)}
            />
            <input
              className="text-input"
              placeholder="닉네임"
              required
              value={author}
              onChange={(event) => setAuthor(event.target.value)}
            />
            <textarea
              className="text-input text-area"
              placeholder="방문 경험, 영업 상태, 취급 품목, 줄 길이 같은 정보를 남겨보세요."
              required
              rows={6}
              value={content}
              onChange={(event) => setContent(event.target.value)}
            />
            <button
              className="primary-action compact-action"
              disabled={postMutation.isPending}
              type="submit"
            >
              {postMutation.isPending ? '등록 중...' : '게시글 등록'}
            </button>
            <p className="form-help-text">
              추후에는 검수된 활동에 따라 리워드 정책을 붙일 수 있도록 구조를 열어둘 예정입니다.
            </p>
            {postMutation.isError ? (
              <p className="error-text">{(postMutation.error as Error).message}</p>
            ) : null}
          </form>
        </article>

        <article className="section detail-card">
          <div className="section-header">
            <div>
              <span className="section-label">FEED</span>
              <h2>최근 올라온 제보와 후기</h2>
            </div>
            <span className="meta-text">{postsQuery.data?.totalElements ?? 0}개 글</span>
          </div>
          {postsQuery.isLoading ? <p>게시글을 불러오는 중입니다.</p> : null}
          {postsQuery.isError ? (
            <p className="error-text">{(postsQuery.error as Error).message}</p>
          ) : null}
          <div className="source-list">
            {latestPosts.map((post) => (
              <Link className="source-card source-card-rich" key={post.id} to={`/community/${post.id}`}>
                <div className="source-card-header">
                  <strong>{post.title}</strong>
                  <span className="meta-text">조회 {post.viewCount}</span>
                </div>
                <p>{post.content}</p>
                <p>
                  {post.authorNickname} · {formatDateTime(post.createdAt)}
                </p>
              </Link>
            ))}
          </div>
          {postsQuery.data ? (
            <div className="pagination-row">
              <button
                className="ghost-action compact-action"
                disabled={page === 0}
                type="button"
                onClick={() => {
                  const next = new URLSearchParams(searchParams)
                  next.set('page', String(page - 1))
                  setSearchParams(next)
                }}
              >
                이전
              </button>
              <button
                className="ghost-action compact-action"
                disabled={postsQuery.data.last}
                type="button"
                onClick={() => {
                  const next = new URLSearchParams(searchParams)
                  next.set('page', String(page + 1))
                  setSearchParams(next)
                }}
              >
                다음
              </button>
            </div>
          ) : null}
        </article>
      </section>
    </main>
  )
}
