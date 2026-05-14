package com.aniwhere.server.adapter.out.persistence

import com.aniwhere.server.adapter.out.persistence.entity.ShopEntity
import com.aniwhere.server.adapter.out.persistence.entity.ShopImageEntity
import com.aniwhere.server.adapter.out.persistence.entity.ShopImageRoleEnum
import com.aniwhere.server.adapter.out.persistence.entity.ShopStatusEnum
import com.aniwhere.server.adapter.out.persistence.mapper.ShopMapper
import com.aniwhere.server.adapter.out.persistence.repository.RegionRepository
import com.aniwhere.server.adapter.out.persistence.repository.ShopRepository
import com.aniwhere.server.common.exception.EntityNotFoundException
import com.aniwhere.server.domain.shop.model.Shop
import com.aniwhere.server.domain.shop.model.ShopStatus
import com.aniwhere.server.domain.shop.port.out.ShopImagePersistenceRow
import com.aniwhere.server.domain.shop.port.out.ShopPersistencePort
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.repository.findByIdOrNull
import org.springframework.stereotype.Component
import org.springframework.transaction.annotation.Transactional

@Component
@Transactional(readOnly = true)
class ShopPersistenceAdapter(
    private val shopRepo: ShopRepository,
    private val regionRepo: RegionRepository,
    private val shopMapper: ShopMapper,
) : ShopPersistencePort {

    override fun findById(id: Long) = shopRepo.findByIdOrNull(id)?.let(shopMapper::toDomain)

    override fun findAll(
        regionId: Short?,
        categoryName: String?,
        keyword: String?,
        workName: String?,
        status: ShopStatus?,
        pageable: Pageable,
    ): Page<Shop> =
        shopRepo.search(
            regionId,
            categoryName,
            keyword,
            workName,
            status?.let { ShopStatusEnum.valueOf(it.name.lowercase()) },
            pageable,
        ).map(shopMapper::toDomain)

    @Transactional(readOnly = false)
    override fun save(shop: Shop): Shop {
        val region = shop.regionId?.let { regionRepo.findByIdOrNull(it) }
        val entity = ShopEntity(
            name = shop.name, address = shop.address,
            px = shop.px, py = shop.py, floor = shop.floor,
            region = region,
            status = ShopStatusEnum.valueOf(shop.status.name.lowercase()),
            sellsIchibanKuji = shop.sellsIchibanKuji,
            visitTip = shop.visitTip,
        )
        return shopMapper.toDomain(shopRepo.save(entity))
    }

    @Transactional(readOnly = false)
    override fun saveShopImageRecords(shopId: Long, rows: List<ShopImagePersistenceRow>) {
        val shop = shopRepo.findByIdOrNull(shopId) ?: throw EntityNotFoundException("Shop not found: $shopId")
        rows.forEach { row ->
            shop.images.add(
                ShopImageEntity(
                    shop = shop,
                    s3Key = row.s3Key,
                    role = ShopImageRoleEnum.valueOf(row.role.name.lowercase()),
                    sortOrder = row.sortOrder,
                ),
            )
        }
        shopRepo.save(shop)
    }

    @Transactional(readOnly = false)
    override fun swapShopImageRecords(
        shopId: Long,
        newPrimaryRow: ShopImagePersistenceRow?,
        galleryReplacementRows: List<ShopImagePersistenceRow>?,
        existingGalleryImageIds: List<Long>,
    ): List<String> {
        val shop = shopRepo.findByIdOrNull(shopId) ?: throw EntityNotFoundException("Shop not found: $shopId")
        val removedKeys = mutableListOf<String>()
        if (newPrimaryRow != null) {
            val oldPrimary = shop.images.filter { it.role == ShopImageRoleEnum.primary }.toList()
            oldPrimary.forEach {
                removedKeys.add(it.s3Key)
                shop.images.remove(it)
            }
            shop.images.add(imageRowToEntity(shop, newPrimaryRow))
        }
        if (galleryReplacementRows != null) {
            val oldGallery = shop.images.filter { it.role == ShopImageRoleEnum.gallery }.toList()
            val oldGalleryById = oldGallery.associateBy { it.id }
            val existingGalleryRows = existingGalleryImageIds.mapNotNull { oldGalleryById[it] }
            val existingGalleryIdSet = existingGalleryImageIds.toSet()
            oldGallery.forEach {
                if (it.id !in existingGalleryIdSet) {
                    removedKeys.add(it.s3Key)
                }
                shop.images.remove(it)
            }
            existingGalleryRows.forEachIndexed { index, image ->
                shop.images.add(
                    ShopImageEntity(
                        shop = shop,
                        s3Key = image.s3Key,
                        role = ShopImageRoleEnum.gallery,
                        sortOrder = index + 1,
                    ),
                )
            }
            galleryReplacementRows.forEach { shop.images.add(imageRowToEntity(shop, it)) }
        }
        shopRepo.save(shop)
        return removedKeys
    }

    private fun imageRowToEntity(shop: ShopEntity, row: ShopImagePersistenceRow) = ShopImageEntity(
        shop = shop,
        s3Key = row.s3Key,
        role = ShopImageRoleEnum.valueOf(row.role.name.lowercase()),
        sortOrder = row.sortOrder,
    )

    @Transactional(readOnly = false)
    override fun update(id: Long, shop: Shop): Shop {
        val entity = shopRepo.findByIdOrNull(id) ?: throw EntityNotFoundException("Shop not found: $id")
        entity.name = shop.name
        entity.address = shop.address
        entity.px = shop.px
        entity.py = shop.py
        entity.floor = shop.floor
        entity.status = ShopStatusEnum.valueOf(shop.status.name.lowercase())
        entity.sellsIchibanKuji = shop.sellsIchibanKuji
        entity.visitTip = shop.visitTip
        entity.region = shop.regionId?.let { regionRepo.findByIdOrNull(it) }
        return shopMapper.toDomain(shopRepo.save(entity))
    }

    @Transactional(readOnly = false)
    override fun deleteById(id: Long) {
        if (!shopRepo.existsById(id)) throw EntityNotFoundException("Shop not found: $id")
        shopRepo.deleteById(id)
    }
}
