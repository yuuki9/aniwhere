package com.aniwhere.server.domain.shop.port.`in`

import com.aniwhere.server.domain.shop.model.Shop
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable

interface ShopUseCase {
    fun getShop(id: Long): Shop
    fun searchShops(regionId: Short?, categoryName: String?, keyword: String?, workName: String?, pageable: Pageable): Page<Shop>
    fun createShop(shop: Shop): Shop
    fun updateShop(id: Long, shop: Shop): Shop
    fun deleteShop(id: Long)
}
