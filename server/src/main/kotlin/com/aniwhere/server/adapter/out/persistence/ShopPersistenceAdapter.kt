package com.aniwhere.server.adapter.out.persistence

import com.aniwhere.server.adapter.out.persistence.entity.ShopEntity
import com.aniwhere.server.adapter.out.persistence.entity.ShopImageEntity
import com.aniwhere.server.adapter.out.persistence.entity.ShopImageRoleEnum
import com.aniwhere.server.adapter.out.persistence.entity.ShopStatusEnum
import com.aniwhere.server.adapter.out.persistence.mapper.ShopMapper
import com.aniwhere.server.adapter.out.persistence.repository.CategoryFacetCountRow
import com.aniwhere.server.adapter.out.persistence.repository.RegionFacetCountRow
import com.aniwhere.server.adapter.out.persistence.repository.CategoryRepository
import com.aniwhere.server.adapter.out.persistence.repository.RegionRepository
import com.aniwhere.server.adapter.out.persistence.repository.ShopRepository
import com.aniwhere.server.adapter.out.persistence.repository.StatusFacetCountRow
import com.aniwhere.server.adapter.out.persistence.repository.WorkFacetCatalogRow
import com.aniwhere.server.adapter.out.persistence.repository.WorkFacetGroupCountRow
import com.aniwhere.server.adapter.out.persistence.repository.WorkRepository
import com.aniwhere.server.common.exception.BadRequestException
import com.aniwhere.server.domain.shop.model.FacetCategoryItem
import com.aniwhere.server.domain.shop.model.FacetRegionItem
import com.aniwhere.server.domain.shop.model.FacetStatusItem
import com.aniwhere.server.domain.shop.model.FacetWorkItem
import com.aniwhere.server.common.exception.EntityNotFoundException
import com.aniwhere.server.domain.shop.model.Shop
import com.aniwhere.server.domain.shop.model.ShopFacetQuery
import com.aniwhere.server.domain.shop.model.ShopFacetResponse
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
    override fun findFacets(query: ShopFacetQuery): ShopFacetResponse {
        val applyRegion = query.regionIds.isNotEmpty()
        val applyCategory = query.categoryIds.isNotEmpty()
        val applySelectedWork = query.workIds.isNotEmpty()
        val statusFilter = query.status?.toEntityStatus()
        val regionIds = query.regionIds
        val categoryIds = query.categoryIds
        val selectedWorkIds = query.workIds

        val regionRows = shopRepo.findRegionFacetCounts(
            query.keyword,
            regionIds,
            applyCategory,
            categoryIds,
            applySelectedWork,
            selectedWorkIds,
            statusFilter,
            query.swLat,
            query.swLng,
            query.neLat,
            query.neLng,
        )
        val categoryRows = shopRepo.findCategoryFacetCounts(
            query.keyword,
            applyRegion,
            regionIds,
            query.categoryIds.isNotEmpty(),
            categoryIds,
            applySelectedWork,
            selectedWorkIds,
            statusFilter,
            query.swLat,
            query.swLng,
            query.neLat,
            query.neLng,
        )
        val workCatalog = shopRepo.findWorkFacetCatalog(query.type?.name)
        val workCandidateCounts = shopRepo.findWorkFacetCandidateCounts(
            query.keyword,
            applyRegion,
            regionIds,
            applyCategory,
            categoryIds,
            statusFilter,
            query.swLat,
            query.swLng,
            query.neLat,
            query.neLng,
            query.type?.name,
        )
        val selectedBaseCount = if (applySelectedWork) {
            shopRepo.countWorkFacetSelectedBase(
                query.keyword,
                applyRegion,
                regionIds,
                applyCategory,
                categoryIds,
                statusFilter,
                query.swLat,
                query.swLng,
                query.neLat,
                query.neLng,
                true,
                selectedWorkIds,
            )
        } else {
            0L
        }
        val selectedIntersections = if (applySelectedWork) {
            shopRepo.findWorkFacetSelectedIntersections(
                query.keyword,
                applyRegion,
                regionIds,
                applyCategory,
                categoryIds,
                statusFilter,
                query.swLat,
                query.swLng,
                query.neLat,
                query.neLng,
                true,
                selectedWorkIds,
                query.type?.name,
            )
        } else {
            emptyList()
        }
        val statusRows = shopRepo.findStatusFacetCounts(
            query.keyword,
            applyRegion,
            regionIds,
            applyCategory,
            categoryIds,
            applySelectedWork,
            selectedWorkIds,
            query.swLat,
            query.swLng,
            query.neLat,
            query.neLng,
        )

        return ShopFacetResponse(
            regions = regionRows.map { it.toFacetItem(query.regionIds) },
            categories = categoryRows.map { it.toFacetItem(query.categoryIds) },
            works = buildWorkFacetItems(
                catalog = workCatalog,
                candidateCounts = workCandidateCounts,
                selectedIntersectionCounts = selectedIntersections,
                selectedWorkIds = selectedWorkIds,
                selectedBaseCount = selectedBaseCount,
            ),
            statuses = statusRows.toStatusFacetItems(query.status),
        )
    }

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

    private fun ShopStatus.toEntityStatus(): ShopStatusEnum = ShopStatusEnum.valueOf(name.lowercase())

    private fun RegionFacetCountRow.toFacetItem(selectedIds: Set<Short>) = FacetRegionItem(
        id = id,
        name = name,
        selected = id in selectedIds,
        disabled = count == 0L,
        count = count,
    )

    private fun CategoryFacetCountRow.toFacetItem(selectedIds: Set<Short>) = FacetCategoryItem(
        id = id,
        name = name,
        selected = id in selectedIds,
        disabled = count == 0L,
        count = count,
    )

    private fun buildWorkFacetItems(
        catalog: List<WorkFacetCatalogRow>,
        candidateCounts: List<WorkFacetGroupCountRow>,
        selectedIntersectionCounts: List<WorkFacetGroupCountRow>,
        selectedWorkIds: Set<Int>,
        selectedBaseCount: Long,
    ): List<FacetWorkItem> {
        val candidateCountMap = candidateCounts.associate { it.workId to it.count }
        val intersectionCountMap = selectedIntersectionCounts.associate { it.workId to it.count }
        val hasSelected = selectedWorkIds.isNotEmpty()
        return catalog.map { row ->
            val candidateCount = candidateCountMap[row.id] ?: 0L
            val count = when {
                !hasSelected -> candidateCount
                row.id in selectedWorkIds -> selectedBaseCount
                else -> selectedBaseCount + candidateCount - (intersectionCountMap[row.id] ?: 0L)
            }
            FacetWorkItem(
                id = row.id,
                name = row.name,
                coverUrl = row.coverUrl,
                selected = row.id in selectedWorkIds,
                disabled = count == 0L,
                count = count,
            )
        }
    }

    private fun List<StatusFacetCountRow>.toStatusFacetItems(selectedStatus: ShopStatus?): List<FacetStatusItem> {
        val countByStatus = associate { it.status to it.count }
        val selectedEnum = selectedStatus?.toEntityStatus()
        val selectedCount = selectedEnum?.let { countByStatus[it] ?: 0L } ?: 0L
        return ShopStatusEnum.entries.map { status ->
            val candidateCount = countByStatus[status] ?: 0L
            val combinedCount = when {
                selectedEnum == null -> candidateCount
                selectedEnum == status -> selectedCount
                else -> selectedCount + candidateCount
            }
            FacetStatusItem(
                value = status.name.uppercase(),
                label = status.toFacetLabel(),
                selected = selectedEnum == status,
                disabled = combinedCount == 0L,
                count = combinedCount,
            )
        }
    }

    private fun ShopStatusEnum.toFacetLabel(): String = when (this) {
        ShopStatusEnum.active -> "운영중"
        ShopStatusEnum.closed -> "폐업"
        ShopStatusEnum.unverified -> "검증중"
    }

}
