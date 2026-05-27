package com.aniwhere.server.adapter.out.persistence

import com.aniwhere.server.adapter.out.persistence.entity.ShopReviewStatusEnum
import com.aniwhere.server.adapter.out.persistence.mapper.ShopReviewMapper
import com.aniwhere.server.adapter.out.persistence.repository.ShopRepository
import com.aniwhere.server.adapter.out.persistence.repository.ShopReviewRepository
import com.aniwhere.server.adapter.out.persistence.repository.UserRepository
import com.aniwhere.server.common.exception.EntityNotFoundException
import com.aniwhere.server.domain.shopreview.model.ShopRatingAggregate
import com.aniwhere.server.domain.shopreview.model.ShopReview
import com.aniwhere.server.domain.shopreview.model.ShopReviewStatus
import com.aniwhere.server.domain.shopreview.port.out.ShopReviewPersistencePort
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.repository.findByIdOrNull
import org.springframework.stereotype.Component
import org.springframework.transaction.annotation.Transactional
import java.math.RoundingMode

@Component
@Transactional(readOnly = true)
class ShopReviewPersistenceAdapter(
    private val reviewRepo: ShopReviewRepository,
    private val shopRepo: ShopRepository,
    private val userRepo: UserRepository,
    private val mapper: ShopReviewMapper,
) : ShopReviewPersistencePort {

    override fun existsShop(shopId: Long): Boolean = shopRepo.existsById(shopId)

    @Transactional(readOnly = false)
    override fun save(review: ShopReview): ShopReview {
        val author = userRepo.findByIdOrNull(review.authorUserId)
            ?: throw EntityNotFoundException("User not found: ${review.authorUserId}")
        val entity = mapper.toEntity(review, author)
        return mapper.toDomain(reviewRepo.save(entity))
    }

    override fun findVisibleByShopId(shopId: Long, pageable: Pageable): Page<ShopReview> =
        reviewRepo.findByShopIdAndStatusOrderByCreatedAtDesc(
            shopId,
            ShopReviewStatusEnum.VISIBLE,
            pageable,
        ).map(mapper::toDomain)

    override fun findByIdAndShopId(reviewId: Long, shopId: Long): ShopReview? =
        reviewRepo.findByIdAndShopId(reviewId, shopId)?.let(mapper::toDomain)

    @Transactional(readOnly = false)
    override fun update(reviewId: Long, review: ShopReview): ShopReview {
        val entity = reviewRepo.findByIdOrNull(reviewId)
            ?: throw EntityNotFoundException("Review not found: $reviewId")
        entity.rating = review.rating
        entity.content = review.content
        entity.updatedAt = java.time.LocalDateTime.now()
        return mapper.toDomain(reviewRepo.save(entity))
    }

    @Transactional(readOnly = false)
    override fun updateStatus(reviewId: Long, shopId: Long, status: ShopReviewStatus): ShopReview {
        val entity = reviewRepo.findByIdAndShopId(reviewId, shopId)
            ?: throw EntityNotFoundException("Review not found: $reviewId")
        entity.status = ShopReviewStatusEnum.valueOf(status.name)
        entity.updatedAt = java.time.LocalDateTime.now()
        return mapper.toDomain(reviewRepo.save(entity))
    }

    @Transactional(readOnly = false)
    override fun recomputeShopRating(shopId: Long): ShopRatingAggregate {
        val shop = shopRepo.findByIdOrNull(shopId)
            ?: throw EntityNotFoundException("Shop not found: $shopId")
        val visible = ShopReviewStatusEnum.VISIBLE
        val count = reviewRepo.countByShopIdAndStatus(shopId, visible).toInt()
        val avg = if (count == 0) {
            null
        } else {
            reviewRepo.calculateAverageRating(shopId, visible)
                ?.setScale(2, RoundingMode.HALF_UP)
        }
        shop.averageRating = avg
        shop.reviewCount = count
        shopRepo.save(shop)
        return ShopRatingAggregate(averageRating = avg, reviewCount = count)
    }
}
