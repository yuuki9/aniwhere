package com.aniwhere.server.domain.community.port.`in`

import com.aniwhere.server.domain.community.model.Comment
import com.aniwhere.server.domain.community.model.Post
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable

interface PostUseCase {
    fun getPost(id: Long): Post
    fun listPosts(pageable: Pageable): Page<Post>
    fun createPost(post: Post): Post
    fun updatePost(id: Long, post: Post): Post
    fun deletePost(id: Long)
}

interface CommentUseCase {
    fun listComments(postId: Long): List<Comment>
    fun createComment(comment: Comment): Comment
    fun deleteComment(id: Long)
}
