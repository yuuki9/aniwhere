package com.aniwhere.server.adapter.out.persistence.repository

import com.aniwhere.server.adapter.out.persistence.entity.CommentEntity
import com.aniwhere.server.adapter.out.persistence.entity.PostEntity
import org.springframework.data.jpa.repository.JpaRepository

interface PostRepository : JpaRepository<PostEntity, Long>

interface CommentRepository : JpaRepository<CommentEntity, Long> {
    fun findByPostIdOrderByCreatedAtAsc(postId: Long): List<CommentEntity>
}
