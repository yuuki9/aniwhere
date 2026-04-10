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

  return (
    <main className="app-shell">
      <section className="section top-bar">
        <Link className="text-link" to="/community">
          목록으로
        </Link>
      </section>

      {postQuery.data ? (
        <section className="section detail-card">
          <span className="section-label">POST</span>
          <h2>{postQuery.data.title}</h2>
          <p>{postQuery.data.content}</p>
          <p>
            {postQuery.data.authorNickname} · {formatDateTime(postQuery.data.createdAt)} · 조회{' '}
            {postQuery.data.viewCount}
          </p>
        </section>
      ) : null}

      <section className="explorer-layout">
        <article className="section detail-card">
          <span className="section-label">COMMENT</span>
          <h2>댓글 작성</h2>
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
              placeholder="댓글 내용"
              required
              rows={4}
              value={content}
              onChange={(event) => setContent(event.target.value)}
            />
            <button className="primary-action compact-action" type="submit">
              댓글 등록
            </button>
            {commentMutation.isError ? (
              <p className="error-text">{(commentMutation.error as Error).message}</p>
            ) : null}
          </form>
        </article>

        <article className="section detail-card">
          <span className="section-label">COMMENTS</span>
          <h2>댓글 목록</h2>
          <div className="source-list">
            {commentsQuery.data?.map((item) => (
              <article className="source-card" key={item.id}>
                <strong>{item.authorNickname}</strong>
                <p>{item.content}</p>
                <p>{formatDateTime(item.createdAt)}</p>
              </article>
            ))}
          </div>
        </article>
      </section>
    </main>
  )
}
