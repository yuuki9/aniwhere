package com.aniwhere.server.adapter.out.persistence.mapper

import com.aniwhere.server.adapter.out.persistence.entity.ShopReviewEntity
import com.aniwhere.server.adapter.out.persistence.entity.ShopReviewStatusEnum
import com.aniwhere.server.adapter.out.persistence.entity.UserEntity
import com.aniwhere.server.config.ReviewImagesS3Properties
import com.aniwhere.server.domain.shopreview.model.ShopReview
import com.aniwhere.server.domain.shopreview.model.ShopReviewImage
import com.aniwhere.server.domain.shopreview.model.ShopReviewStatus
import org.springframework.stereotype.Component

@Component
class ShopReviewMapper(
    private val reviewImagesS3: ReviewImagesS3Properties,
) {
    fun toDomain(entity: ShopReviewEntity): ShopReview {
        val authorNickname = entity.author.nickname?.trim()?.takeIf { it.isNotEmpty() } ?: "익명"
        return ShopReview(
            id = entity.id,
            shopId = entity.shopId,
            authorUserId = entity.author.id!!,
            authorNickname = authorNickname,
            rating = entity.rating,
            content = entity.content,
            status = ShopReviewStatus.valueOf(entity.status.name),
            images = entity.images.map { image ->
                ShopReviewImage(
                    id = image.id,
                    url = reviewImagesS3.resolvePublicUrl(image.s3Key),
                    sortOrder = image.sortOrder,
                )
            },
            createdAt = entity.createdAt,
            updatedAt = entity.updatedAt,
        )
    }

    fun toEntity(review: ShopReview, author: UserEntity): ShopReviewEntity = ShopReviewEntity(
        shopId = review.shopId,
        author = author,
        rating = review.rating,
        content = review.content,
        status = ShopReviewStatusEnum.valueOf(review.status.name),
    )
}
