package com.aniwhere.server.domain.shopreview.port.`in`

import com.aniwhere.server.domain.shop.model.ImageUploadPart
import com.aniwhere.server.domain.shopreview.model.ShopReview
import com.aniwhere.server.domain.shopreview.model.ShopReviewStatus
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable

interface ShopReviewUseCase {
    fun listReviews(shopId: Long, pageable: Pageable): Page<ShopReview>
    fun createReview(
        authorUserId: Long,
        shopId: Long,
        rating: Int,
        content: String,
        imageParts: List<ImageUploadPart> = emptyList(),
    ): ShopReview
    fun updateReview(
        actorUserId: Long,
        shopId: Long,
        reviewId: Long,
        rating: Int,
        content: String,
        imageParts: List<ImageUploadPart> = emptyList(),
    ): ShopReview
    fun deleteReview(actorUserId: Long, shopId: Long, reviewId: Long)
    fun updateReviewStatus(
        actorUserId: Long,
        shopId: Long,
        reviewId: Long,
        status: ShopReviewStatus,
    ): ShopReview
}
