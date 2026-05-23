package com.aniwhere.server.domain.community.port.`in`

import com.aniwhere.server.domain.community.model.Comment
import com.aniwhere.server.domain.community.model.Post
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable

interface PostUseCase {
    fun getPost(id: Long): Post
    fun listPosts(pageable: Pageable): Page<Post>
    fun createPost(authorUserId: Long, post: Post): Post
    fun updatePost(actorUserId: Long, id: Long, post: Post): Post
    fun deletePost(actorUserId: Long, id: Long)
    fun likePost(postId: Long, userId: Long)
    fun unlikePost(postId: Long, userId: Long)
}

interface CommentUseCase {
    fun listComments(postId: Long): List<Comment>
    fun createComment(authorUserId: Long, comment: Comment): Comment
    fun deleteComment(actorUserId: Long, id: Long)
}
