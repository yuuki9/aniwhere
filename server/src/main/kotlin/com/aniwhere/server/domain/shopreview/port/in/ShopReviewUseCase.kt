package com.aniwhere.server.domain.shopreview.port.`in`

import com.aniwhere.server.domain.shop.model.ImageUploadPart
import com.aniwhere.server.domain.shopreview.model.RecentShopReview
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
    fun listRecentReviews(
        limit: Int = DEFAULT_RECENT_REVIEW_LIMIT,
        viewerUserId: Long? = null,
    ): List<RecentShopReview>
    fun listMyReviews(
        userId: Long,
        sort: ShopReviewSort,
        pageable: Pageable,
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
        replaceImages: Boolean = false,
        imageParts: List<ImageUploadPart> = emptyList(),
        existingImageIds: List<Long> = emptyList(),
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

    companion object {
        const val DEFAULT_RECENT_REVIEW_LIMIT = 10
        const val MIN_RECENT_REVIEW_LIMIT = 1
        const val MAX_RECENT_REVIEW_LIMIT = 50
    }
}
