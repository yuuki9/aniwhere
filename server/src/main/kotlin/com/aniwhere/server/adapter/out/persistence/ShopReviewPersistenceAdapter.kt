package com.aniwhere.server.adapter.out.persistence

import com.aniwhere.server.adapter.out.persistence.entity.ShopReviewStatusEnum
import com.aniwhere.server.adapter.out.persistence.mapper.ShopReviewMapper
import com.aniwhere.server.adapter.out.persistence.repository.ShopRepository
import com.aniwhere.server.adapter.out.persistence.repository.ShopReviewLikeRepository
import com.aniwhere.server.adapter.out.persistence.repository.ShopReviewRepository
import com.aniwhere.server.adapter.out.persistence.repository.UserRepository
import com.aniwhere.server.common.exception.EntityNotFoundException
import com.aniwhere.server.domain.shopreview.model.ShopRatingAggregate
import com.aniwhere.server.domain.shopreview.model.ShopReview
import com.aniwhere.server.domain.shopreview.model.ShopReviewStatus
import com.aniwhere.server.adapter.out.persistence.entity.ShopReviewImageEntity
import com.aniwhere.server.adapter.out.persistence.entity.ShopReviewLikeEntity
import com.aniwhere.server.domain.shopreview.port.out.ShopReviewImagePersistenceRow
import com.aniwhere.server.domain.shopreview.port.out.ShopReviewPersistencePort
import org.springframework.data.domain.Page
import org.springframework.data.domain.PageRequest
import org.springframework.data.domain.Pageable
import org.springframework.data.domain.Sort
import org.springframework.data.repository.findByIdOrNull
import org.springframework.stereotype.Component
import org.springframework.transaction.annotation.Transactional
import java.math.BigDecimal
import java.math.RoundingMode

@Component
@Transactional(readOnly = true)
class ShopReviewPersistenceAdapter(
    private val reviewRepo: ShopReviewRepository,
    private val reviewLikeRepo: ShopReviewLikeRepository,
    private val shopRepo: ShopRepository,
    private val userRepo: UserRepository,
    private val mapper: ShopReviewMapper,
) : ShopReviewPersistencePort {

    override fun existsUser(userId: Long): Boolean = userRepo.existsById(userId)

    override fun existsShop(shopId: Long): Boolean = shopRepo.existsById(shopId)

    @Transactional(readOnly = false)
    override fun save(review: ShopReview): ShopReview {
        val author = userRepo.findByIdOrNull(review.authorUserId)
            ?: throw EntityNotFoundException("User not found: ${review.authorUserId}")
        val entity = mapper.toEntity(review, author)
        return mapper.toDomain(reviewRepo.save(entity))
    }

    override fun findVisibleByShopId(shopId: Long, pageable: Pageable): Page<ShopReview> =
        reviewRepo.findByShopIdAndStatus(
            shopId,
            ShopReviewStatusEnum.VISIBLE,
            pageable,
        ).map(mapper::toDomain)

    override fun findRecentVisible(limit: Int): List<ShopReview> {
        val pageable = PageRequest.of(
            0,
            limit,
            Sort.by(Sort.Order.desc("createdAt"), Sort.Order.desc("id")),
        )
        return reviewRepo.findByStatus(ShopReviewStatusEnum.VISIBLE, pageable)
            .content
            .map(mapper::toDomain)
    }

    override fun findByAuthorUserIdExcludingDeleted(authorUserId: Long, pageable: Pageable): Page<ShopReview> =
        reviewRepo.findByAuthor_IdAndStatusIn(
            authorUserId,
            MY_REVIEW_STATUSES,
            pageable,
        ).map(mapper::toDomain)

    override fun findByIdAndShopId(reviewId: Long, shopId: Long): ShopReview? =
        reviewRepo.findByIdAndShopId(reviewId, shopId)?.let(mapper::toDomain)

    override fun findVisibleByIdAndShopId(reviewId: Long, shopId: Long): ShopReview? =
        reviewRepo.findByIdAndShopId(reviewId, shopId)
            ?.takeIf { it.status == ShopReviewStatusEnum.VISIBLE }
            ?.let(mapper::toDomain)

    @Transactional(readOnly = false)
    override fun update(reviewId: Long, review: ShopReview): ShopReview {
        val entity = reviewRepo.findByIdAndShopId(reviewId, review.shopId)
            ?: throw EntityNotFoundException("Review not found: $reviewId for shop: ${review.shopId}")
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
    override fun saveReviewImages(reviewId: Long, rows: List<ShopReviewImagePersistenceRow>) {
        val entity = reviewRepo.findByIdOrNull(reviewId)
            ?: throw EntityNotFoundException("Review not found: $reviewId")
        rows.forEach { row ->
            entity.images.add(
                ShopReviewImageEntity(
                    review = entity,
                    s3Key = row.s3Key,
                    sortOrder = row.sortOrder,
                ),
            )
        }
        reviewRepo.save(entity)
    }

    override fun findReviewImageS3Keys(reviewId: Long): List<String> {
        val entity = reviewRepo.findByIdOrNull(reviewId)
            ?: throw EntityNotFoundException("Review not found: $reviewId")
        return entity.images.map { it.s3Key }
    }

    @Transactional(readOnly = false)
    override fun replaceReviewImages(reviewId: Long, rows: List<ShopReviewImagePersistenceRow>) {
        val entity = reviewRepo.findByIdOrNull(reviewId)
            ?: throw EntityNotFoundException("Review not found: $reviewId")
        entity.images.clear()
        rows.forEach { row ->
            entity.images.add(
                ShopReviewImageEntity(
                    review = entity,
                    s3Key = row.s3Key,
                    sortOrder = row.sortOrder,
                ),
            )
        }
        reviewRepo.save(entity)
    }

    @Transactional(readOnly = false)
    override fun swapReviewImages(
        reviewId: Long,
        newImageRows: List<ShopReviewImagePersistenceRow>,
        existingImageIds: List<Long>,
    ): List<String> {
        val entity = reviewRepo.findByIdOrNull(reviewId)
            ?: throw EntityNotFoundException("Review not found: $reviewId")
        val oldImages = entity.images.toList()
        val oldById = oldImages.associateBy { it.id }
        val existingImageIdSet = existingImageIds.toSet()
        val existingRows = existingImageIds.mapNotNull { oldById[it] }
        val removedKeys = mutableListOf<String>()
        oldImages.forEach { image ->
            if (image.id !in existingImageIdSet) {
                removedKeys.add(image.s3Key)
            }
            entity.images.remove(image)
        }
        existingRows.forEachIndexed { index, image ->
            entity.images.add(
                ShopReviewImageEntity(
                    review = entity,
                    s3Key = image.s3Key,
                    sortOrder = index,
                ),
            )
        }
        newImageRows.forEach { row ->
            entity.images.add(
                ShopReviewImageEntity(
                    review = entity,
                    s3Key = row.s3Key,
                    sortOrder = row.sortOrder,
                ),
            )
        }
        reviewRepo.save(entity)
        return removedKeys
    }

    @Transactional(readOnly = false)
    override fun deleteById(reviewId: Long) {
        reviewRepo.deleteById(reviewId)
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
                ?.let { BigDecimal.valueOf(it).setScale(2, RoundingMode.HALF_UP) }
        }
        shop.averageRating = avg
        shop.reviewCount = count
        shopRepo.save(shop)
        return ShopRatingAggregate(averageRating = avg, reviewCount = count)
    }

    override fun existsReviewLike(reviewId: Long, userId: Long): Boolean =
        reviewLikeRepo.existsByReview_IdAndUser_Id(reviewId, userId)

    @Transactional(readOnly = false)
    override fun saveReviewLike(reviewId: Long, userId: Long) {
        if (existsReviewLike(reviewId, userId)) return
        val review = reviewRepo.findByIdOrNull(reviewId)
            ?: throw EntityNotFoundException("Review not found: $reviewId")
        val user = userRepo.findByIdOrNull(userId)
            ?: throw EntityNotFoundException("User not found: $userId")
        reviewLikeRepo.save(ShopReviewLikeEntity(review = review, user = user))
        reviewRepo.incrementLikeCount(reviewId)
    }

    @Transactional(readOnly = false)
    override fun deleteReviewLike(reviewId: Long, userId: Long) {
        if (reviewLikeRepo.deleteByReview_IdAndUser_Id(reviewId, userId) == 0L) return
        reviewRepo.decrementLikeCount(reviewId)
    }

    override fun findLikedReviewIds(userId: Long, reviewIds: Collection<Long>): Set<Long> {
        if (reviewIds.isEmpty()) return emptySet()
        return reviewLikeRepo.findReviewIdsByUserIdAndReviewIdIn(userId, reviewIds).toSet()
    }

    override fun findShopNamesByIds(shopIds: Collection<Long>): Map<Long, String> {
        if (shopIds.isEmpty()) return emptyMap()
        return shopRepo.findAllById(shopIds).associate { requireNotNull(it.id) to it.name }
    }

    private companion object {
        val MY_REVIEW_STATUSES = setOf(ShopReviewStatusEnum.VISIBLE, ShopReviewStatusEnum.HIDDEN)
    }
}
