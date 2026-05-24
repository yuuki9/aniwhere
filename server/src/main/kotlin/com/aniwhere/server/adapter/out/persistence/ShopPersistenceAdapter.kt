package com.aniwhere.server.adapter.out.persistence

import com.aniwhere.server.adapter.out.persistence.entity.ShopEntity
import com.aniwhere.server.adapter.out.persistence.entity.ShopImageEntity
import com.aniwhere.server.adapter.out.persistence.entity.ShopImageRoleEnum
import com.aniwhere.server.adapter.out.persistence.entity.ShopStatusEnum
import com.aniwhere.server.adapter.out.persistence.mapper.ShopMapper
import com.aniwhere.server.adapter.out.persistence.repository.CategoryRepository
import com.aniwhere.server.adapter.out.persistence.repository.RegionRepository
import com.aniwhere.server.adapter.out.persistence.repository.ShopRepository
import com.aniwhere.server.adapter.out.persistence.repository.WorkRepository
import com.aniwhere.server.common.exception.BadRequestException
import com.aniwhere.server.domain.shop.model.FacetCategoryItem
import com.aniwhere.server.domain.shop.model.FacetRegionItem
import com.aniwhere.server.domain.shop.model.FacetWorkTypeItem
import com.aniwhere.server.common.exception.EntityNotFoundException
import com.aniwhere.server.domain.shop.model.Shop
import com.aniwhere.server.domain.shop.model.ShopFacetResponse
import com.aniwhere.server.domain.shop.model.ShopStatus
import com.aniwhere.server.domain.shop.port.out.ShopImagePersistenceRow
import com.aniwhere.server.domain.shop.port.out.ShopPersistencePort
import com.aniwhere.server.domain.work.model.WorkType
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
    private val categoryRepo: CategoryRepository,
    private val workRepo: WorkRepository,
    private val shopMapper: ShopMapper,
) : ShopPersistencePort {

    /**
     * 조회 후 [ShopMapper.toDomain]에서 지연 컬렉션을 읽으므로,
     * 호출부가 NOT_SUPPORTED 등으로 세션 밖에 있어도 매핑까지 같은 영속성 컨텍스트에서 끝나도록 한다.
     */
    @Transactional(readOnly = true)
    override fun findById(id: Long) = shopRepo.findByIdOrNull(id)?.let(shopMapper::toDomain)

    @Transactional(readOnly = true)
    override fun findFacets(
        includeRegions: Boolean,
        includeCategories: Boolean,
        includeWorkTypes: Boolean,
    ): ShopFacetResponse = ShopFacetResponse(
        regions = if (includeRegions) {
            regionRepo.findAllWithShopCount().map { FacetRegionItem(id = it.id, name = it.name) }
        } else {
            emptyList()
        },
        categories = if (includeCategories) {
            categoryRepo.findAllWithShopCount().map { FacetCategoryItem(id = it.id, name = it.name) }
        } else {
            emptyList()
        },
        workTypes = if (includeWorkTypes) {
            WorkType.entries.map { it.toFacetItem() }
        } else {
            emptyList()
        },
    )

    @Transactional(readOnly = true)
    override fun findAll(
        regionId: Short?,
        categoryName: String?,
        categoryIds: Set<Short>,
        keyword: String?,
        workKeyword: String?,
        workId: Int?,
        status: ShopStatus?,
        pageable: Pageable,
    ): Page<Shop> =
        shopRepo.search(
            regionId,
            categoryName,
            categoryIds.isNotEmpty(),
            categoryIds,
            keyword,
            workKeyword,
            workId,
            status?.let { ShopStatusEnum.valueOf(it.name.lowercase()) },
            pageable,
        ).map(shopMapper::toDomain)

    @Transactional(readOnly = false)
    override fun save(shop: Shop): Shop {
        val region = shop.regionId?.let { regionRepo.findByIdOrNull(it) }
        val categories = resolveCategories(shop.categoryIds)
        val works = resolveWorks(shop.workIds)
        val entity = ShopEntity(
            name = shop.name, address = shop.address,
            px = shop.px, py = shop.py, floor = shop.floor,
            region = region,
            status = ShopStatusEnum.valueOf(shop.status.name.lowercase()),
            visitTip = shop.visitTip,
        )
        entity.categories.addAll(categories)
        entity.works.addAll(works)
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
        val categories = resolveCategories(shop.categoryIds)
        val works = resolveWorks(shop.workIds)
        entity.name = shop.name
        entity.address = shop.address
        entity.px = shop.px
        entity.py = shop.py
        entity.floor = shop.floor
        entity.status = ShopStatusEnum.valueOf(shop.status.name.lowercase())
        entity.visitTip = shop.visitTip
        entity.region = shop.regionId?.let { regionRepo.findByIdOrNull(it) }
        entity.categories.clear()
        entity.categories.addAll(categories)
        entity.works.clear()
        entity.works.addAll(works)
        return shopMapper.toDomain(shopRepo.save(entity))
    }

    @Transactional(readOnly = false)
    override fun deleteById(id: Long) {
        if (!shopRepo.existsById(id)) throw EntityNotFoundException("Shop not found: $id")
        shopRepo.deleteById(id)
    }

    private fun resolveCategories(categoryIds: List<Short>) =
        resolveRelatedIds(
            ids = categoryIds,
            fieldName = "categoryIds",
            findAll = categoryRepo::findAllById,
            idOf = { checkNotNull(it.id) { "category id absent" } },
        )

    private fun resolveWorks(workIds: List<Int>) =
        resolveRelatedIds(
            ids = workIds,
            fieldName = "workIds",
            findAll = workRepo::findAllById,
            idOf = { checkNotNull(it.id) { "work id absent" } },
        )

    private fun <T, E> resolveRelatedIds(
        ids: List<T>,
        fieldName: String,
        findAll: (Iterable<T>) -> Iterable<E>,
        idOf: (E) -> T,
    ): Set<E> {
        assertNoDuplicateIds(ids, fieldName)
        if (ids.isEmpty()) return emptySet()
        val found = findAll(ids).toList()
        if (found.size != ids.size) {
            val foundIds = found.map(idOf).toSet()
            val missing = ids.first { it !in foundIds }
            throw BadRequestException("Unknown $fieldName: $missing")
        }
        return found.toSet()
    }

    private fun <T> assertNoDuplicateIds(ids: List<T>, fieldName: String) {
        val seen = mutableSetOf<T>()
        for (id in ids) {
            if (!seen.add(id)) {
                throw BadRequestException("Duplicate $fieldName: $id")
            }
        }
    }

    private fun WorkType.toFacetItem(): FacetWorkTypeItem = FacetWorkTypeItem(
        value = name,
        label = when (this) {
            WorkType.ANIMATION -> "애니메이션"
            WorkType.GAME -> "게임"
        },
    )

}
