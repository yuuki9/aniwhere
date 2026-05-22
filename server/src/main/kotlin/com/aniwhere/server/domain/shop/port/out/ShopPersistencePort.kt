package com.aniwhere.server.domain.shop.port.out

import com.aniwhere.server.domain.shop.model.Shop
import com.aniwhere.server.domain.shop.model.ShopFacetQuery
import com.aniwhere.server.domain.shop.model.ShopFacetResponse
import com.aniwhere.server.domain.shop.model.ShopImageRole
import com.aniwhere.server.domain.shop.model.ShopStatus
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable

data class ShopImagePersistenceRow(
    val s3Key: String,
    val role: ShopImageRole,
    val sortOrder: Int,
)

interface ShopPersistencePort {
    fun findById(id: Long): Shop?
    fun findFacets(query: ShopFacetQuery): ShopFacetResponse
    fun findAll(
        regionId: Short?,
        categoryName: String?,
        categoryIds: Set<Short>,
        keyword: String?,
        workKeyword: String?,
        workId: Int?,
        status: ShopStatus?,
        pageable: Pageable,
    ): Page<Shop>
    fun save(shop: Shop): Shop
    fun saveShopImageRecords(shopId: Long, rows: List<ShopImagePersistenceRow>)

    /** 기존 primary/gallery 레코드를 제거하고 새 행으로 바꿉니다(null 인 범위는 변경하지 않음). 제거된 S3 키 목록을 반환합니다. */
    fun swapShopImageRecords(
        shopId: Long,
        newPrimaryRow: ShopImagePersistenceRow?,
        galleryReplacementRows: List<ShopImagePersistenceRow>?,
        existingGalleryImageIds: List<Long> = emptyList(),
    ): List<String>

    fun update(id: Long, shop: Shop): Shop
    fun deleteById(id: Long)
}
