package com.aniwhere.server.domain.shop.service

import com.aniwhere.server.common.exception.EntityNotFoundException
import com.aniwhere.server.domain.shop.model.Shop
import com.aniwhere.server.domain.shop.port.`in`.ShopUseCase
import com.aniwhere.server.domain.shop.port.out.ShopPersistencePort
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
@Transactional(readOnly = true)
class ShopService(private val port: ShopPersistencePort) : ShopUseCase {

    override fun getShop(id: Long) =
        port.findById(id) ?: throw EntityNotFoundException("Shop not found: $id")

    override fun searchShops(regionId: Short?, categoryName: String?, keyword: String?, workName: String?, pageable: Pageable): Page<Shop> =
        port.findAll(regionId, categoryName, keyword, workName, pageable)

    @Transactional
    override fun createShop(shop: Shop) = port.save(shop)

    @Transactional
    override fun updateShop(id: Long, shop: Shop) = port.update(id, shop)

    @Transactional
    override fun deleteShop(id: Long) = port.deleteById(id)
}
