import { request, toQueryString } from './client'
import type {
  Comment,
  CreateCommentPayload,
  CreatePostPayload,
  PageResponse,
  PagingParams,
  Post,
  Unit,
  UpdatePostPayload,
} from './types'

export function getPosts(params: PagingParams = {}) {
  const query = toQueryString({
    page: params.page ?? 0,
    size: params.size ?? 20,
    sort: params.sort,
  })
  return request<PageResponse<Post>>(`/api/v1/posts${query}`)
}

export function getPost(id: number) {
  return request<Post>(`/api/v1/posts/${id}`)
}

export function createPost(payload: CreatePostPayload) {
  return request<Post>('/api/v1/posts', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function updatePost(id: number, payload: UpdatePostPayload) {
  return request<Post>(`/api/v1/posts/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
}

export function deletePost(id: number) {
  return request<Unit>(`/api/v1/posts/${id}`, {
    method: 'DELETE',
  })
}

export function getComments(postId: number) {
  return request<Comment[]>(`/api/v1/posts/${postId}/comments`)
}

export function createComment(postId: number, payload: CreateCommentPayload) {
  return request<Comment>(`/api/v1/posts/${postId}/comments`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function deleteComment(postId: number, commentId: number) {
  return request<Unit>(`/api/v1/posts/${postId}/comments/${commentId}`, {
    method: 'DELETE',
  })
}
