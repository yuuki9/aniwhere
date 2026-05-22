package com.aniwhere.server.domain.shop.model

import com.aniwhere.server.domain.work.model.WorkType
import java.math.BigDecimal

data class ShopFacetQuery(
    val keyword: String? = null,
    val regionIds: Set<Short> = emptySet(),
    val categoryIds: Set<Short> = emptySet(),
    val workIds: Set<Int> = emptySet(),
    val status: ShopStatus? = null,
    val swLat: BigDecimal? = null,
    val swLng: BigDecimal? = null,
    val neLat: BigDecimal? = null,
    val neLng: BigDecimal? = null,
    val type: WorkType? = null,
)

data class ShopFacetResponse(
    val regions: List<FacetRegionItem> = emptyList(),
    val categories: List<FacetCategoryItem> = emptyList(),
    val works: List<FacetWorkItem> = emptyList(),
    val statuses: List<FacetStatusItem> = emptyList(),
)

data class FacetRegionItem(
    val id: Short,
    val name: String,
    val selected: Boolean = false,
    val disabled: Boolean = false,
    val count: Long = 0,
)

data class FacetCategoryItem(
    val id: Short,
    val name: String,
    val selected: Boolean = false,
    val disabled: Boolean = false,
    val count: Long = 0,
)

data class FacetWorkItem(
    val id: Int,
    val name: String,
    val coverUrl: String? = null,
    val selected: Boolean = false,
    val disabled: Boolean = false,
    val count: Long = 0,
)

data class FacetStatusItem(
    val value: String,
    val label: String,
    val selected: Boolean = false,
    val disabled: Boolean = false,
    val count: Long = 0,
)
