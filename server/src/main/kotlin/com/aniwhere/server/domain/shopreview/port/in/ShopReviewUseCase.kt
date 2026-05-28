package com.aniwhere.server.domain.shopreview.port.`in`

import com.aniwhere.server.domain.shop.model.ImageUploadPart
import com.aniwhere.server.domain.shopreview.model.ShopReview
import com.aniwhere.server.domain.shopreview.model.ShopReviewSort
import com.aniwhere.server.domain.shopreview.model.ShopReviewStatus
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable

interface ShopReviewUseCase {
    fun listReviews(
        shopId: Long,
        sort: ShopReviewSort,
        pageable: Pageable,
        viewerUserId: Long? = null,
    ): Page<ShopReview>
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
        rating: Int? = null,
        content: String? = null,
        imageParts: List<ImageUploadPart>? = null,
    ): ShopReview
    fun deleteReview(actorUserId: Long, shopId: Long, reviewId: Long)
    fun updateReviewStatus(
        actorUserId: Long,
        shopId: Long,
        reviewId: Long,
        status: ShopReviewStatus,
    ): ShopReview
    fun likeReview(userId: Long, shopId: Long, reviewId: Long)
    fun unlikeReview(userId: Long, shopId: Long, reviewId: Long)
}
