package com.aniwhere.server.domain.shop.model

data class ShopFacetResponse(
    val regions: List<FacetRegionItem> = emptyList(),
    val categories: List<FacetCategoryItem> = emptyList(),
    val workTypes: List<FacetWorkTypeItem> = emptyList(),
    val sorts: List<FacetSortItem> = emptyList(),
)

data class FacetRegionItem(
    val id: Short,
    val name: String,
)

data class FacetCategoryItem(
    val id: Short,
    val name: String,
)

data class FacetWorkTypeItem(
    val value: String,
    val label: String,
)

data class FacetSortItem(
    val value: String,
    val label: String,
)
