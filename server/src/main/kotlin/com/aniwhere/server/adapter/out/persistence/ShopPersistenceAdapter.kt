package com.aniwhere.server.adapter.out.persistence

import com.aniwhere.server.adapter.out.persistence.entity.ShopEntity
import com.aniwhere.server.adapter.out.persistence.entity.ShopStatusEnum
import com.aniwhere.server.adapter.out.persistence.mapper.ShopMapper
import com.aniwhere.server.adapter.out.persistence.repository.RegionRepository
import com.aniwhere.server.adapter.out.persistence.repository.ShopRepository
import com.aniwhere.server.common.exception.EntityNotFoundException
import com.aniwhere.server.domain.shop.model.Shop
import com.aniwhere.server.domain.shop.port.out.ShopPersistencePort
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.repository.findByIdOrNull
import org.springframework.stereotype.Component

@Component
class ShopPersistenceAdapter(
    private val shopRepo: ShopRepository,
    private val regionRepo: RegionRepository,
) : ShopPersistencePort {

    override fun findById(id: Long) = shopRepo.findByIdOrNull(id)?.let(ShopMapper::toDomain)

    override fun findAll(regionId: Short?, categoryName: String?, keyword: String?, pageable: Pageable): Page<Shop> =
        shopRepo.search(regionId, categoryName, keyword, pageable).map(ShopMapper::toDomain)

    override fun save(shop: Shop): Shop {
        val region = shop.regionId?.let { regionRepo.findByIdOrNull(it) }
        val entity = ShopEntity(
            name = shop.name, address = shop.address,
            px = shop.px, py = shop.py, floor = shop.floor,
            region = region,
            status = ShopStatusEnum.valueOf(shop.status.name.lowercase()),
        )
        return ShopMapper.toDomain(shopRepo.save(entity))
    }

    override fun update(id: Long, shop: Shop): Shop {
        val entity = shopRepo.findByIdOrNull(id) ?: throw EntityNotFoundException("Shop not found: $id")
        entity.name = shop.name
        entity.address = shop.address
        entity.px = shop.px
        entity.py = shop.py
        entity.floor = shop.floor
        entity.status = ShopStatusEnum.valueOf(shop.status.name.lowercase())
        entity.region = shop.regionId?.let { regionRepo.findByIdOrNull(it) }
        return ShopMapper.toDomain(shopRepo.save(entity))
    }

    override fun deleteById(id: Long) {
        if (!shopRepo.existsById(id)) throw EntityNotFoundException("Shop not found: $id")
        shopRepo.deleteById(id)
    }
}
