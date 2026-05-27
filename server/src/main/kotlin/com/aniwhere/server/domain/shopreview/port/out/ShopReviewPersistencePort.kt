package com.aniwhere.server.domain.shopreview.port.out

import com.aniwhere.server.domain.shopreview.model.ShopRatingAggregate
import com.aniwhere.server.domain.shopreview.model.ShopReview
import com.aniwhere.server.domain.shopreview.model.ShopReviewStatus
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable

interface ShopReviewPersistencePort {
    fun existsShop(shopId: Long): Boolean
    fun save(review: ShopReview): ShopReview
    fun findVisibleByShopId(shopId: Long, pageable: Pageable): Page<ShopReview>
    fun findByIdAndShopId(reviewId: Long, shopId: Long): ShopReview?
    fun update(reviewId: Long, review: ShopReview): ShopReview
    fun updateStatus(reviewId: Long, shopId: Long, status: ShopReviewStatus): ShopReview
    fun recomputeShopRating(shopId: Long): ShopRatingAggregate
}
