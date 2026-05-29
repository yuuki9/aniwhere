package com.aniwhere.server.domain.shop.model

import com.aniwhere.server.domain.category.model.CategorySummary
import com.aniwhere.server.domain.work.model.WorkSummary
import com.fasterxml.jackson.annotation.JsonProperty
import java.math.BigDecimal
import java.time.LocalDateTime
import org.springframework.data.domain.PageRequest
import org.springframework.data.domain.Pageable
import org.springframework.data.domain.Sort

enum class ShopSort {
    NEWEST,
    REVIEW_COUNT_DESC,
    FAVORITE_COUNT_DESC,
}

fun ShopSort.toPageable(pageable: Pageable): Pageable =
    PageRequest.of(pageable.pageNumber, pageable.pageSize, toSpringSort())

fun ShopSort.toSpringSort(): Sort = when (this) {
    ShopSort.NEWEST -> Sort.by(Sort.Order.desc("createdAt"), Sort.Order.desc("id"))
    ShopSort.REVIEW_COUNT_DESC -> Sort.by(Sort.Order.desc("reviewCount"), Sort.Order.desc("id"))
    ShopSort.FAVORITE_COUNT_DESC -> Sort.by(Sort.Order.desc("favoriteCount"), Sort.Order.desc("id"))
}

fun ShopSort.toFacetItem(): FacetSortItem = FacetSortItem(
    value = name,
    label = when (this) {
        ShopSort.NEWEST -> "최신순"
        ShopSort.REVIEW_COUNT_DESC -> "리뷰 많은순"
        ShopSort.FAVORITE_COUNT_DESC -> "즐겨찾기 많은순"
    },
)

data class Shop(
    val id: Long? = null,
    val name: String,
    val address: String,
    val px: BigDecimal,
    val py: BigDecimal,
    val floor: String? = null,
    val regionId: Short? = null,
    val regionName: String? = null,
    @get:JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
    val categoryIds: List<Short> = emptyList(),
    @get:JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
    val workIds: List<Int> = emptyList(),
    val status: ShopStatus = ShopStatus.UNVERIFIED,
    val visitTip: String? = null,
    val categories: List<CategorySummary> = emptyList(),
    val works: List<WorkSummary> = emptyList(),
    val links: List<ShopLink> = emptyList(),
    val images: List<ShopImage> = emptyList(),
    val description: String? = null,
    val averageRating: BigDecimal? = null,
    val reviewCount: Int = 0,
    val favoriteCount: Int = 0,
    val createdAt: LocalDateTime? = null,
    val updatedAt: LocalDateTime? = null,
)

enum class ShopStatus { ACTIVE, CLOSED, UNVERIFIED }

data class ShopLink(
    val id: Long? = null,
    val type: LinkType,
    val url: String,
)

enum class LinkType { BLOG, INSTA, X, PLACE, HOMEPAGE }
