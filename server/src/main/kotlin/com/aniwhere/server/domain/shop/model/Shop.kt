package com.aniwhere.server.domain.shop.model

import com.aniwhere.server.domain.category.model.CategorySummary
import com.aniwhere.server.domain.work.model.WorkSummary
import com.fasterxml.jackson.annotation.JsonProperty
import java.math.BigDecimal
import java.time.LocalDateTime

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
