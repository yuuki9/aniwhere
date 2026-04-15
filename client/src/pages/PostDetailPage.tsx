import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { createComment, getComments, getPost } from '../shared/api/community'
import { formatDateTime } from '../shared/lib/format'

export function PostDetailPage() {
  const { postId } = useParams()
  const parsedId = Number(postId)
  const queryClient = useQueryClient()
  const [author, setAuthor] = useState('')
  const [content, setContent] = useState('')

  const postQuery = useQuery({
    queryKey: ['post', parsedId],
    queryFn: () => getPost(parsedId),
    enabled: Number.isFinite(parsedId),
  })

  const commentsQuery = useQuery({
    queryKey: ['comments', parsedId],
    queryFn: () => getComments(parsedId),
    enabled: Number.isFinite(parsedId),
  })

  const commentMutation = useMutation({
    mutationFn: () =>
      createComment(parsedId, {
        authorNickname: author,
        content,
      }),
    onSuccess: () => {
      setAuthor('')
      setContent('')
      queryClient.invalidateQueries({ queryKey: ['comments', parsedId] })
    },
  })

  if (!Number.isFinite(parsedId)) {
    return (
      <main className="app-shell">
        <section className="section">
          <h1>잘못된 게시글 경로입니다.</h1>
          <Link className="text-link" to="/community">
            커뮤니티로 이동
          </Link>
        </section>
      </main>
    )
  }

  const post = postQuery.data
  const comments = commentsQuery.data ?? []

  return (
    <main className="app-shell">
      <section className="section top-bar">
        <Link className="text-link" to="/community">
          목록으로
        </Link>
      </section>

      {post ? (
        <section className="launch-panel post-hero">
          <div className="launch-copy">
            <span className="eyebrow">POST DETAIL</span>
            <h1>{post.title}</h1>
            <p>{post.content}</p>
          </div>
          <div className="hero-stat-card">
            <span className="section-label">작성 정보</span>
            <strong>{post.authorNickname}</strong>
            <p>
              {formatDateTime(post.createdAt)} · 조회 {post.viewCount}
            </p>
          </div>
        </section>
      ) : null}

      <section className="explorer-layout layout-community">
        <article className="section detail-card composer-panel">
          <div className="section-header">
            <div>
              <span className="section-label">COMMENT</span>
              <h2>댓글 남기기</h2>
            </div>
          </div>
          <form
            className="form-mock"
            onSubmit={(event) => {
              event.preventDefault()
              commentMutation.mutate()
            }}
          >
            <input
              className="text-input"
              placeholder="닉네임"
              required
              value={author}
              onChange={(event) => setAuthor(event.target.value)}
            />
            <textarea
              className="text-input text-area"
              placeholder="방문 경험이나 추가 정보를 남겨보세요."
              required
              rows={4}
              value={content}
              onChange={(event) => setContent(event.target.value)}
            />
            <button
              className="primary-action compact-action"
              disabled={commentMutation.isPending}
              type="submit"
            >
              {commentMutation.isPending ? '등록 중...' : '댓글 등록'}
            </button>
            {commentMutation.isError ? (
              <p className="error-text">{(commentMutation.error as Error).message}</p>
            ) : null}
          </form>
        </article>

        <article className="section detail-card">
          <div className="section-header">
            <div>
              <span className="section-label">COMMENTS</span>
              <h2>대화 흐름</h2>
            </div>
            <span className="meta-text">{comments.length}개</span>
          </div>
          {commentsQuery.isLoading ? <p>댓글을 불러오는 중입니다.</p> : null}
          {commentsQuery.isError ? (
            <p className="error-text">{(commentsQuery.error as Error).message}</p>
          ) : null}
          <div className="source-list">
            {comments.map((item) => (
              <article className="source-card source-card-rich" key={item.id}>
                <div className="source-card-header">
                  <strong>{item.authorNickname}</strong>
                  <span className="meta-text">{formatDateTime(item.createdAt)}</span>
                </div>
                <p>{item.content}</p>
              </article>
            ))}
          </div>
        </article>
      </section>
    </main>
  )
}
