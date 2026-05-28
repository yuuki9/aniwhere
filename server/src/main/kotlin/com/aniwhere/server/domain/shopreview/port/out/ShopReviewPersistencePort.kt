package com.aniwhere.server.domain.shopreview.port.out

import com.aniwhere.server.domain.shopreview.model.ShopRatingAggregate
import com.aniwhere.server.domain.shopreview.model.ShopReview
import com.aniwhere.server.domain.shopreview.model.ShopReviewStatus
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable

data class ShopReviewImagePersistenceRow(
    val s3Key: String,
    val sortOrder: Int,
)

interface ShopReviewPersistencePort {
    fun existsShop(shopId: Long): Boolean
    fun save(review: ShopReview): ShopReview
    fun findVisibleByShopId(shopId: Long, pageable: Pageable): Page<ShopReview>
    fun findByIdAndShopId(reviewId: Long, shopId: Long): ShopReview?
    fun findVisibleByIdAndShopId(reviewId: Long, shopId: Long): ShopReview?
    fun update(reviewId: Long, review: ShopReview): ShopReview
    fun updateStatus(reviewId: Long, shopId: Long, status: ShopReviewStatus): ShopReview
    fun saveReviewImages(reviewId: Long, rows: List<ShopReviewImagePersistenceRow>)
    fun findReviewImageS3Keys(reviewId: Long): List<String>
    fun replaceReviewImages(reviewId: Long, rows: List<ShopReviewImagePersistenceRow>)
    fun deleteById(reviewId: Long)
    fun recomputeShopRating(shopId: Long): ShopRatingAggregate
    fun existsReviewLike(reviewId: Long, userId: Long): Boolean
    fun saveReviewLike(reviewId: Long, userId: Long)
    fun deleteReviewLike(reviewId: Long, userId: Long)
    fun findLikedReviewIds(userId: Long, reviewIds: Collection<Long>): Set<Long>
}
