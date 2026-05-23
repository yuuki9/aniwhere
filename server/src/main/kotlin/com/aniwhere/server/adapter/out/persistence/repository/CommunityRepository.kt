package com.aniwhere.server.adapter.out.persistence.repository

import com.aniwhere.server.adapter.out.persistence.entity.CommentEntity
import com.aniwhere.server.adapter.out.persistence.entity.PostLikeEntity
import com.aniwhere.server.adapter.out.persistence.entity.PostEntity
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Modifying
import org.springframework.data.jpa.repository.Query

interface PostRepository : JpaRepository<PostEntity, Long> {
    @Modifying(clearAutomatically = true)
    @Query("update PostEntity p set p.viewCount = p.viewCount + 1 where p.id = :postId")
    fun incrementViewCount(postId: Long): Int

    @Modifying(clearAutomatically = true)
    @Query("update PostEntity p set p.likeCount = p.likeCount + 1 where p.id = :postId")
    fun incrementLikeCount(postId: Long): Int

    @Modifying(clearAutomatically = true)
    @Query("update PostEntity p set p.likeCount = case when p.likeCount > 0 then p.likeCount - 1 else 0 end where p.id = :postId")
    fun decrementLikeCount(postId: Long): Int
}

interface CommentRepository : JpaRepository<CommentEntity, Long> {
    fun findByPostIdOrderByCreatedAtAsc(postId: Long): List<CommentEntity>
}

interface PostLikeRepository : JpaRepository<PostLikeEntity, Long> {
    fun existsByPost_IdAndUserId(postId: Long, userId: Long): Boolean
    fun deleteByPost_IdAndUserId(postId: Long, userId: Long): Long
}
