package com.aniwhere.server.domain.community.port.out

import com.aniwhere.server.domain.community.model.Comment
import com.aniwhere.server.domain.community.model.Post
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable

interface PostPersistencePort {
    fun findById(id: Long): Post?
    fun findByIdAndIncreaseViewCount(id: Long): Post?
    fun findAll(pageable: Pageable): Page<Post>
    fun save(post: Post): Post
    fun update(id: Long, post: Post): Post
    fun deleteById(id: Long)
    fun like(postId: Long, userId: Long)
    fun unlike(postId: Long, userId: Long)
}

interface CommentPersistencePort {
    fun findById(id: Long): Comment?
    fun findByPostId(postId: Long): List<Comment>
    fun save(comment: Comment): Comment
    fun deleteById(id: Long)
}
