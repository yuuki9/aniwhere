package com.aniwhere.server.domain.shopreview.service

import com.aniwhere.server.common.exception.BadRequestException
import com.aniwhere.server.common.exception.EntityNotFoundException
import com.aniwhere.server.common.exception.ForbiddenException
import com.aniwhere.server.domain.auth.port.out.AuthPersistencePort
import com.aniwhere.server.domain.shop.model.ImageUploadPart
import com.aniwhere.server.domain.shop.port.out.ShopImageStoragePort
import com.aniwhere.server.domain.shop.service.ShopImagePayloadValidator
import com.aniwhere.server.domain.shopreview.model.ShopReview
import com.aniwhere.server.domain.shopreview.model.ShopReviewStatus
import com.aniwhere.server.domain.shopreview.port.`in`.ShopReviewUseCase
import com.aniwhere.server.domain.shopreview.port.out.ShopReviewImagePersistenceRow
import com.aniwhere.server.domain.shopreview.port.out.ShopReviewPersistencePort
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Propagation
import org.springframework.transaction.annotation.Transactional
import org.springframework.transaction.support.TransactionTemplate
import java.util.UUID

@Service
@Transactional(readOnly = true)
class ShopReviewService(
    private val port: ShopReviewPersistencePort,
    private val authPersistence: AuthPersistencePort,
    private val imageStorage: ShopImageStoragePort,
    private val transactionTemplate: TransactionTemplate,
) : ShopReviewUseCase {

    override fun listReviews(shopId: Long, pageable: Pageable): Page<ShopReview> {
        if (!port.existsShop(shopId)) throw EntityNotFoundException("Shop not found: $shopId")
        return port.findVisibleByShopId(shopId, pageable)
    }

    @Transactional(readOnly = false, propagation = Propagation.NOT_SUPPORTED)
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
        if (imageParts.size > MAX_REVIEW_IMAGES) {
            throw BadRequestException("리뷰 이미지는 최대 ${MAX_REVIEW_IMAGES}장까지 등록할 수 있습니다.")
        }
        imageParts.forEach { validateImageUploadPart(it) }

        val saved = transactionTemplate.execute {
            port.save(
                ShopReview(
                    shopId = shopId,
                    authorUserId = authorUserId,
                    authorNickname = "",
                    rating = rating,
                    content = trimmedContent,
                    status = ShopReviewStatus.VISIBLE,
                ),
            )
        } ?: error("Review save failed")
        val reviewId = saved.id ?: error("Review id missing after save")

        val rows = mutableListOf<ShopReviewImagePersistenceRow>()
        val uploadedKeys = mutableListOf<String>()

        try {
            imageParts.forEachIndexed { index, part ->
                val key = "$shopId/reviews/$reviewId/${UUID.randomUUID()}.${extensionFor(part.contentType)}"
                imageStorage.putObject(key, part.bytes, normalizeContentType(part.contentType))
                uploadedKeys.add(key)
                rows.add(ShopReviewImagePersistenceRow(s3Key = key, sortOrder = index))
            }

            if (rows.isNotEmpty()) {
                transactionTemplate.execute {
                    port.saveReviewImages(reviewId, rows)
                }
            }

            transactionTemplate.execute {
                port.recomputeShopRating(shopId)
            }
        } catch (e: Exception) {
            compensateCreateReviewFailure(e, reviewId, uploadedKeys)
            throw e
        }

        return port.findByIdAndShopId(reviewId, shopId) ?: saved
    }

    @Transactional(readOnly = false, propagation = Propagation.NOT_SUPPORTED)
    override fun updateReview(
        actorUserId: Long,
        shopId: Long,
        reviewId: Long,
        rating: Int?,
        content: String?,
        imageParts: List<ImageUploadPart>?,
    ): ShopReview {
        val existing = port.findByIdAndShopId(reviewId, shopId)
            ?: throw EntityNotFoundException("Review not found: $reviewId")
        requireOwnership(actorUserId, existing.authorUserId)

        val newRating = rating?.also { validateRating(it) } ?: existing.rating
        val newContent = content?.let { validateContent(it) } ?: existing.content

        if (imageParts != null) {
            if (imageParts.size > MAX_REVIEW_IMAGES) {
                throw BadRequestException("리뷰 이미지는 최대 ${MAX_REVIEW_IMAGES}장까지 등록할 수 있습니다.")
            }
            imageParts.forEach { validateImageUploadPart(it) }

            val oldKeys = port.findReviewImageS3Keys(reviewId)
            val rows = mutableListOf<ShopReviewImagePersistenceRow>()
            val uploadedKeys = mutableListOf<String>()

            try {
                imageParts.forEachIndexed { index, part ->
                    val key = "$shopId/reviews/$reviewId/${UUID.randomUUID()}.${extensionFor(part.contentType)}"
                    imageStorage.putObject(key, part.bytes, normalizeContentType(part.contentType))
                    uploadedKeys.add(key)
                    rows.add(ShopReviewImagePersistenceRow(s3Key = key, sortOrder = index))
                }

                transactionTemplate.execute {
                    port.update(reviewId, existing.copy(rating = newRating, content = newContent))
                    port.replaceReviewImages(reviewId, rows)
                    port.recomputeShopRating(shopId)
                }

                for (key in oldKeys) {
                    runCatching { imageStorage.deleteObject(key) }
                }
            } catch (e: Exception) {
                for (key in uploadedKeys) {
                    runCatching { imageStorage.deleteObject(key) }
                        .exceptionOrNull()
                        ?.let { e.addSuppressed(it) }
                }
                throw e
            }
        } else {
            transactionTemplate.execute {
                port.update(reviewId, existing.copy(rating = newRating, content = newContent))
                port.recomputeShopRating(shopId)
            }
        }

        return port.findByIdAndShopId(reviewId, shopId)
            ?: existing.copy(rating = newRating, content = newContent)
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

    private fun compensateCreateReviewFailure(original: Exception, reviewId: Long, uploadedKeys: List<String>) {
        for (key in uploadedKeys) {
            runCatching { imageStorage.deleteObject(key) }
                .exceptionOrNull()
                ?.let { original.addSuppressed(it) }
        }
        runCatching {
            transactionTemplate.execute {
                port.deleteById(reviewId)
            }
        }.exceptionOrNull()
            ?.let { original.addSuppressed(it) }
    }

    private fun validateImageUploadPart(part: ImageUploadPart) {
        val normalized = normalizeContentType(part.contentType)
        if (normalized !in ALLOWED_IMAGE_TYPES) {
            throw BadRequestException("지원하지 않는 이미지 형식입니다. 허용: JPEG, PNG, WebP, GIF")
        }
        ShopImagePayloadValidator.validate(part.bytes, normalized)
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

    private companion object {
        const val MAX_REVIEW_IMAGES = 5
        private val ALLOWED_IMAGE_TYPES = setOf("image/jpeg", "image/png", "image/webp", "image/gif")

        fun normalizeContentType(raw: String): String {
            val base = raw.substringBefore(';').trim().lowercase()
            return if (base == "image/jpg") "image/jpeg" else base
        }

        fun extensionFor(rawContentType: String): String = when (normalizeContentType(rawContentType)) {
            "image/jpeg" -> "jpg"
            "image/png" -> "png"
            "image/webp" -> "webp"
            "image/gif" -> "gif"
            else -> "bin"
        }
    }
}
