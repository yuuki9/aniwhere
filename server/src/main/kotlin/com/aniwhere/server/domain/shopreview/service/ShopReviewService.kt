package com.aniwhere.server.domain.shopreview.service

import com.aniwhere.server.common.exception.BadRequestException
import com.aniwhere.server.common.exception.EntityNotFoundException
import com.aniwhere.server.common.exception.ForbiddenException
import com.aniwhere.server.domain.auth.port.out.AuthPersistencePort
import com.aniwhere.server.domain.shop.model.ImageUploadPart
import com.aniwhere.server.domain.shopreview.model.ShopReview
import com.aniwhere.server.domain.shopreview.model.ShopReviewStatus
import com.aniwhere.server.domain.shopreview.port.`in`.ShopReviewUseCase
import com.aniwhere.server.domain.shopreview.port.out.ShopReviewPersistencePort
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
@Transactional(readOnly = true)
class ShopReviewService(
    private val port: ShopReviewPersistencePort,
    private val authPersistence: AuthPersistencePort,
) : ShopReviewUseCase {

    override fun listReviews(shopId: Long, pageable: Pageable): Page<ShopReview> {
        if (!port.existsShop(shopId)) throw EntityNotFoundException("Shop not found: $shopId")
        return port.findVisibleByShopId(shopId, pageable)
    }

    @Transactional
    override fun createReview(
        authorUserId: Long,
        shopId: Long,
        rating: Int,
        content: String,
        imageParts: List<ImageUploadPart>,
    ): ShopReview {
        if (!port.existsShop(shopId)) throw EntityNotFoundException("Shop not found: $shopId")
        validateRating(rating)
        val trimmedContent = validateContent(content)
        if (imageParts.isNotEmpty()) {
            // Image upload is implemented in Task 6.
        }
        val saved = port.save(
            ShopReview(
                shopId = shopId,
                authorUserId = authorUserId,
                authorNickname = "",
                rating = rating,
                content = trimmedContent,
                status = ShopReviewStatus.VISIBLE,
            ),
        )
        port.recomputeShopRating(shopId)
        return saved
    }

    @Transactional
    override fun updateReview(
        actorUserId: Long,
        shopId: Long,
        reviewId: Long,
        rating: Int,
        content: String,
        imageParts: List<ImageUploadPart>,
    ): ShopReview {
        validateRating(rating)
        val trimmedContent = validateContent(content)
        val existing = port.findByIdAndShopId(reviewId, shopId)
            ?: throw EntityNotFoundException("Review not found: $reviewId")
        requireOwnership(actorUserId, existing.authorUserId)
        if (imageParts.isNotEmpty()) {
            // Image upload is implemented in Task 6.
        }
        val updated = port.update(
            reviewId,
            existing.copy(rating = rating, content = trimmedContent),
        )
        port.recomputeShopRating(shopId)
        return updated
    }

    @Transactional
    override fun deleteReview(actorUserId: Long, shopId: Long, reviewId: Long) {
        val existing = port.findByIdAndShopId(reviewId, shopId)
            ?: throw EntityNotFoundException("Review not found: $reviewId")
        requireOwnership(actorUserId, existing.authorUserId)
        port.updateStatus(reviewId, shopId, ShopReviewStatus.DELETED)
        port.recomputeShopRating(shopId)
    }

    @Transactional
    override fun updateReviewStatus(
        actorUserId: Long,
        shopId: Long,
        reviewId: Long,
        status: ShopReviewStatus,
    ): ShopReview {
        if (!authPersistence.isAdmin(actorUserId)) {
            throw ForbiddenException("Only admin can change review status")
        }
        val updated = port.updateStatus(reviewId, shopId, status)
        port.recomputeShopRating(shopId)
        return updated
    }

    private fun validateRating(rating: Int) {
        if (rating !in 1..5) {
            throw BadRequestException("rating must be between 1 and 5")
        }
    }

    private fun validateContent(content: String): String {
        val trimmed = content.trim()
        if (trimmed.isBlank()) {
            throw BadRequestException("content must not be blank")
        }
        return trimmed
    }

    private fun requireOwnership(actorUserId: Long, ownerUserId: Long) {
        if (actorUserId != ownerUserId) {
            throw ForbiddenException("Only the author can modify this review")
        }
    }
}
