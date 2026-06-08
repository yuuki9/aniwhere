package com.aniwhere.server.domain.shopreview.model

import java.math.BigDecimal
import java.time.LocalDateTime
import org.springframework.data.domain.PageRequest
import org.springframework.data.domain.Pageable
import org.springframework.data.domain.Sort

enum class ShopReviewStatus { VISIBLE, HIDDEN, DELETED }

enum class ShopReviewSort {
    NEWEST,
    OLDEST,
    RATING_HIGH,
    RATING_LOW,
}

fun ShopReviewSort.toPageable(pageable: Pageable): Pageable =
    PageRequest.of(pageable.pageNumber, pageable.pageSize, toSpringSort())

fun ShopReviewSort.toSpringSort(): Sort = when (this) {
    ShopReviewSort.NEWEST -> Sort.by(Sort.Order.desc("createdAt"), Sort.Order.desc("id"))
    ShopReviewSort.OLDEST -> Sort.by(Sort.Order.asc("createdAt"), Sort.Order.asc("id"))
    ShopReviewSort.RATING_HIGH -> Sort.by(
        Sort.Order.desc("rating"),
        Sort.Order.desc("createdAt"),
        Sort.Order.desc("id"),
    )
    ShopReviewSort.RATING_LOW -> Sort.by(
        Sort.Order.asc("rating"),
        Sort.Order.desc("createdAt"),
        Sort.Order.desc("id"),
    )
}

data class ShopReviewImage(
    val id: Long? = null,
    val url: String,
    val sortOrder: Int,
)

data class ShopReview(
    val id: Long? = null,
    val shopId: Long,
    val authorUserId: Long,
    val authorNickname: String,
    val authorEmojiIconFilename: String? = null,
    val rating: Int,
    val content: String,
    val status: ShopReviewStatus = ShopReviewStatus.VISIBLE,
    val images: List<ShopReviewImage> = emptyList(),
    val likeCount: Int = 0,
    val likedByMe: Boolean = false,
    val createdAt: LocalDateTime? = null,
    val updatedAt: LocalDateTime? = null,
)

data class ShopRatingAggregate(
    val averageRating: BigDecimal?,
    val reviewCount: Int,
)

data class RecentShopReview(
    val shopName: String,
    val id: Long? = null,
    val shopId: Long,
    val authorUserId: Long,
    val authorNickname: String,
    val authorEmojiIconFilename: String? = null,
    val rating: Int,
    val content: String,
    val images: List<ShopReviewImage> = emptyList(),
    val likeCount: Int = 0,
    val likedByMe: Boolean = false,
    val createdAt: LocalDateTime? = null,
    val updatedAt: LocalDateTime? = null,
) {
    companion object {
        fun from(review: ShopReview, shopName: String) = RecentShopReview(
            shopName = shopName,
            id = review.id,
            shopId = review.shopId,
            authorUserId = review.authorUserId,
            authorNickname = review.authorNickname,
            authorEmojiIconFilename = review.authorEmojiIconFilename,
            rating = review.rating,
            content = review.content,
            images = review.images,
            likeCount = review.likeCount,
            likedByMe = review.likedByMe,
            createdAt = review.createdAt,
            updatedAt = review.updatedAt,
        )
    }
}
