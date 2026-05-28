package com.aniwhere.server.domain.shopreview.model

import java.math.BigDecimal
import java.time.LocalDateTime

enum class ShopReviewStatus { VISIBLE, HIDDEN, DELETED }

data class ShopReviewImage(
    val id: Long? = null,
    val url: String,
    val sortOrder: Int,
)

data class ShopReview(
    val id: Long? = null,
    val shopId: Long,
    val authorUserId: Long,
    val authorNickname: String,
    val rating: Int,
    val content: String,
    val status: ShopReviewStatus = ShopReviewStatus.VISIBLE,
    val images: List<ShopReviewImage> = emptyList(),
    val createdAt: LocalDateTime? = null,
    val updatedAt: LocalDateTime? = null,
)

data class ShopRatingAggregate(
    val averageRating: BigDecimal?,
    val reviewCount: Int,
)
