package com.aniwhere.server.adapter.out.persistence.repository

import com.aniwhere.server.adapter.out.persistence.entity.ShopReviewEntity
import com.aniwhere.server.adapter.out.persistence.entity.ShopReviewStatusEnum
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Modifying
import org.springframework.data.jpa.repository.Query

interface ShopReviewRepository : JpaRepository<ShopReviewEntity, Long> {
    fun findByShopIdAndStatus(
        shopId: Long,
        status: ShopReviewStatusEnum,
        pageable: Pageable,
    ): Page<ShopReviewEntity>

    fun findByAuthor_IdAndStatusIn(
        authorId: Long,
        statuses: Collection<ShopReviewStatusEnum>,
        pageable: Pageable,
    ): Page<ShopReviewEntity>

    fun findByIdAndShopId(id: Long, shopId: Long): ShopReviewEntity?

    @Query("SELECT AVG(r.rating) FROM ShopReviewEntity r WHERE r.shopId = :shopId AND r.status = :status")
    fun calculateAverageRating(shopId: Long, status: ShopReviewStatusEnum): Double?

    fun countByShopIdAndStatus(shopId: Long, status: ShopReviewStatusEnum): Long

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("UPDATE ShopReviewEntity r SET r.likeCount = r.likeCount + 1 WHERE r.id = :reviewId")
    fun incrementLikeCount(reviewId: Long): Int

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query(
        """
        UPDATE ShopReviewEntity r
        SET r.likeCount = CASE WHEN r.likeCount > 0 THEN r.likeCount - 1 ELSE 0 END
        WHERE r.id = :reviewId
        """,
    )
    fun decrementLikeCount(reviewId: Long): Int
}
