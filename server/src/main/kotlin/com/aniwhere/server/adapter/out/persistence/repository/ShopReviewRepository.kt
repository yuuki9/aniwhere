package com.aniwhere.server.adapter.out.persistence.repository

import com.aniwhere.server.adapter.out.persistence.entity.ShopReviewEntity
import com.aniwhere.server.adapter.out.persistence.entity.ShopReviewStatusEnum
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query

interface ShopReviewRepository : JpaRepository<ShopReviewEntity, Long> {
    fun findByShopIdAndStatusOrderByCreatedAtDesc(
        shopId: Long,
        status: ShopReviewStatusEnum,
        pageable: Pageable,
    ): Page<ShopReviewEntity>

    fun findByIdAndShopId(id: Long, shopId: Long): ShopReviewEntity?

    @Query("SELECT AVG(r.rating) FROM ShopReviewEntity r WHERE r.shopId = :shopId AND r.status = :status")
    fun calculateAverageRating(shopId: Long, status: ShopReviewStatusEnum): Double?

    fun countByShopIdAndStatus(shopId: Long, status: ShopReviewStatusEnum): Long
}
