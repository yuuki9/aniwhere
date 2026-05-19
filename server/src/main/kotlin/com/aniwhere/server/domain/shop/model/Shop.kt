package com.aniwhere.server.domain.shop.model

import com.aniwhere.server.domain.work.model.WorkSummary
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
    val status: ShopStatus = ShopStatus.UNVERIFIED,
    val visitTip: String? = null,
    val categories: List<String> = emptyList(),
    val works: List<WorkSummary> = emptyList(),
    val links: List<ShopLink> = emptyList(),
    val images: List<ShopImage> = emptyList(),
    val description: String? = null,
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
