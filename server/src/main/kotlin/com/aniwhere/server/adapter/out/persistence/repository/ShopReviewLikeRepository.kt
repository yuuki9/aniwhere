package com.aniwhere.server.adapter.out.persistence.repository

import com.aniwhere.server.adapter.out.persistence.entity.ShopReviewLikeEntity
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query

interface ShopReviewLikeRepository : JpaRepository<ShopReviewLikeEntity, Long> {
    fun existsByReview_IdAndUser_Id(reviewId: Long, userId: Long): Boolean

    fun deleteByReview_IdAndUser_Id(reviewId: Long, userId: Long): Long

    @Query(
        """
        SELECT l.review.id
        FROM ShopReviewLikeEntity l
        WHERE l.user.id = :userId AND l.review.id IN :reviewIds
        """,
    )
    fun findReviewIdsByUserIdAndReviewIdIn(userId: Long, reviewIds: Collection<Long>): List<Long>
}
