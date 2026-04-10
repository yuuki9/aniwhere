package com.aniwhere.server.domain.shop.port.out

import com.aniwhere.server.domain.shop.model.Shop
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable

interface ShopPersistencePort {
    fun findById(id: Long): Shop?
    fun findAll(regionId: Short?, categoryName: String?, keyword: String?, pageable: Pageable): Page<Shop>
    fun save(shop: Shop): Shop
    fun update(id: Long, shop: Shop): Shop
    fun deleteById(id: Long)
}
