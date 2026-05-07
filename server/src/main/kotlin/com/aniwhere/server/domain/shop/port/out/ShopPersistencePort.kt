package com.aniwhere.server.domain.shop.port.out

import com.aniwhere.server.domain.shop.model.Shop
import com.aniwhere.server.domain.shop.model.ShopImageRole
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable

data class ShopImagePersistenceRow(
    val s3Key: String,
    val role: ShopImageRole,
    val sortOrder: Int,
)

interface ShopPersistencePort {
    fun findById(id: Long): Shop?
    fun findAll(regionId: Short?, categoryName: String?, keyword: String?, workName: String?, pageable: Pageable): Page<Shop>
    fun save(shop: Shop): Shop
    fun saveShopImageRecords(shopId: Long, rows: List<ShopImagePersistenceRow>)
    fun update(id: Long, shop: Shop): Shop
    fun deleteById(id: Long)
}
