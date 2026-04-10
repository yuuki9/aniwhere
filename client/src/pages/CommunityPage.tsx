import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { createPost, getPosts } from '../shared/api/community'
import { formatDateTime } from '../shared/lib/format'

export function CommunityPage() {
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
      <section className="section top-bar">
        <Link className="text-link" to="/">
          샵 탐색으로
        </Link>
      </section>

      <section className="explorer-layout">
        <article className="section detail-card">
          <span className="section-label">WRITE</span>
          <h2>게시글 작성</h2>
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
              placeholder="내용"
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
            {postMutation.isError ? (
              <p className="error-text">{(postMutation.error as Error).message}</p>
            ) : null}
          </form>
        </article>

        <article className="section detail-card">
          <span className="section-label">LIST</span>
          <h2>커뮤니티</h2>
          {postsQuery.isLoading ? <p>게시글을 불러오는 중입니다.</p> : null}
          {postsQuery.isError ? (
            <p className="error-text">{(postsQuery.error as Error).message}</p>
          ) : null}
          <div className="source-list">
            {postsQuery.data?.content.map((post) => (
              <Link className="source-card" key={post.id} to={`/community/${post.id}`}>
                <strong>{post.title}</strong>
                <p>{post.content}</p>
                <p>
                  {post.authorNickname} · {formatDateTime(post.createdAt)} · 조회 {post.viewCount}
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
