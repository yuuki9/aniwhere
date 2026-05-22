package com.aniwhere.server.domain.shop.service

import com.aniwhere.server.common.exception.BadRequestException
import com.aniwhere.server.common.exception.EntityNotFoundException
import com.aniwhere.server.domain.shop.model.ImageUploadPart
import com.aniwhere.server.domain.shop.model.Shop
import com.aniwhere.server.domain.shop.model.ShopFacetQuery
import com.aniwhere.server.domain.shop.model.ShopFacetResponse
import com.aniwhere.server.domain.shop.model.ShopImageRole
import com.aniwhere.server.domain.shop.model.ShopStatus
import com.aniwhere.server.domain.shop.port.`in`.ShopUseCase
import com.aniwhere.server.domain.shop.port.out.ShopImagePersistenceRow
import com.aniwhere.server.domain.shop.port.out.ShopImageStoragePort
import com.aniwhere.server.domain.shop.port.out.ShopPersistencePort
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Propagation
import org.springframework.transaction.annotation.Transactional
import org.springframework.transaction.support.TransactionSynchronization
import org.springframework.transaction.support.TransactionSynchronizationManager
import org.springframework.transaction.support.TransactionTemplate
import java.math.BigDecimal
import java.math.RoundingMode
import java.util.UUID
import java.util.concurrent.ConcurrentHashMap

@Service
@Transactional(readOnly = true)
class ShopService(
    private val port: ShopPersistencePort,
    private val imageStorage: ShopImageStoragePort,
    private val transactionTemplate: TransactionTemplate,
) : ShopUseCase {
    private val facetCache = ConcurrentHashMap<ShopFacetQuery, CachedFacetResponse>()

    override fun getShop(id: Long) =
        port.findById(id) ?: throw EntityNotFoundException("Shop not found: $id")

    override fun getShopFacets(query: ShopFacetQuery): ShopFacetResponse {
        val cacheKey = normalizeForCacheKey(query)
        val cachedOrFresh = facetCache.compute(cacheKey) { _, existing ->
            val now = System.currentTimeMillis()
            if (existing != null && now - existing.cachedAtMillis <= FACET_CACHE_TTL_MILLIS) {
                existing
            } else {
                CachedFacetResponse(response = port.findFacets(query), cachedAtMillis = now)
            }
        } ?: error("Facet cache compute failed")

        return cachedOrFresh.response
    }

    override fun searchShops(
        regionId: Short?,
        categoryName: String?,
        categoryIds: Set<Short>,
        keyword: String?,
        workKeyword: String?,
        workId: Int?,
        status: ShopStatus?,
        pageable: Pageable,
    ): Page<Shop> =
        port.findAll(regionId, categoryName, categoryIds, keyword, workKeyword, workId, status, pageable)

    @Transactional
    override fun createShop(shop: Shop): Shop {
        val created = port.save(shop)
        invalidateFacetCache()
        return created
    }

    @Transactional(readOnly = false, propagation = Propagation.NOT_SUPPORTED)
    override fun createShopWithImages(shop: Shop, cover: ImageUploadPart, gallery: List<ImageUploadPart>): Shop {
        validateImageUploadPart(cover)
        if (gallery.size > MAX_GALLERY_IMAGES) {
            throw BadRequestException("갤러리 이미지는 최대 ${MAX_GALLERY_IMAGES}장까지 등록할 수 있습니다.")
        }
        gallery.forEach { validateImageUploadPart(it) }

        val saved = transactionTemplate.execute {
            port.save(shop.copy(id = null))
        } ?: error("Shop save failed")
        val id = saved.id ?: error("Shop id missing after save")

        val primaryKey = "$id/primary.${extensionFor(cover.contentType)}"
        val rows = mutableListOf(
            ShopImagePersistenceRow(s3Key = primaryKey, role = ShopImageRole.PRIMARY, sortOrder = 0),
        )
        val uploadedKeys = mutableListOf<String>()

        try {
            imageStorage.putObject(primaryKey, cover.bytes, normalizeContentType(cover.contentType))
            uploadedKeys.add(primaryKey)

            gallery.forEachIndexed { index, part ->
                val key = "$id/gallery-${index + 1}.${extensionFor(part.contentType)}"
                imageStorage.putObject(key, part.bytes, normalizeContentType(part.contentType))
                uploadedKeys.add(key)
                rows.add(ShopImagePersistenceRow(s3Key = key, role = ShopImageRole.GALLERY, sortOrder = index + 1))
            }

            transactionTemplate.execute {
                port.saveShopImageRecords(id, rows)
            }
        } catch (e: Exception) {
            compensateCreateShopWithImagesFailure(e, id, uploadedKeys)
            throw e
        }

        val updatedShop = port.findById(id) ?: throw EntityNotFoundException("Shop not found: $id")
        invalidateFacetCache()
        return updatedShop
    }

    @Transactional
    override fun updateShop(id: Long, shop: Shop): Shop {
        val updated = port.update(id, shop)
        invalidateFacetCache()
        return updated
    }

    @Transactional(readOnly = false, propagation = Propagation.NOT_SUPPORTED)
    override fun updateShopWithImages(
        id: Long,
        shop: Shop,
        coverImage: ImageUploadPart?,
        replaceGallery: Boolean,
        gallery: List<ImageUploadPart>,
        existingGalleryImageIds: List<Long>,
    ): Shop {
        val existingShop = port.findById(id) ?: throw EntityNotFoundException("Shop not found: $id")

        if (gallery.isNotEmpty() && !replaceGallery) {
            throw BadRequestException("갤러리 파일은 replaceGallery=true 일 때만 전송할 수 있습니다.")
        }
        if (existingGalleryImageIds.isNotEmpty() && !replaceGallery) {
            throw BadRequestException("기존 갤러리 이미지는 replaceGallery=true 일 때만 전송할 수 있습니다.")
        }
        if (existingGalleryImageIds.distinct().size != existingGalleryImageIds.size) {
            throw BadRequestException("중복된 기존 갤러리 이미지 ID가 포함되어 있습니다.")
        }
        val existingGalleryIds = existingShop.images
            .filter { it.role == ShopImageRole.GALLERY }
            .mapNotNull { it.id }
            .toSet()
        if (!existingGalleryIds.containsAll(existingGalleryImageIds)) {
            throw BadRequestException("기존 갤러리 이미지 ID가 올바르지 않습니다.")
        }

        val hasCoverChange = coverImage != null
        val hasGalleryReplace = replaceGallery

        if (!hasCoverChange && !hasGalleryReplace) {
            transactionTemplate.execute {
                port.update(id, shop)
            }
            val updatedShop = port.findById(id) ?: throw EntityNotFoundException("Shop not found: $id")
            invalidateFacetCache()
            return updatedShop
        }

        if (hasGalleryReplace && existingGalleryImageIds.size + gallery.size > MAX_GALLERY_IMAGES) {
            throw BadRequestException("갤러리 이미지는 최대 ${MAX_GALLERY_IMAGES}장까지 등록할 수 있습니다.")
        }

        if (hasCoverChange) {
            validateImageUploadPart(coverImage!!)
        }
        if (hasGalleryReplace) {
            gallery.forEach { validateImageUploadPart(it) }
        }

        var newPrimaryRow: ShopImagePersistenceRow? = null
        var galleryRows: List<ShopImagePersistenceRow>? = null
        val uploadedKeys = mutableListOf<String>()

        try {
            if (hasCoverChange) {
                val part = coverImage!!
                // 운영 중인 고정 키(예: primary.jpg)를 트랜잭션 전에 덮어쓰면 DB 실패 시에도 클라이언트가 깨진 바이트를 보게 된다. UUID 접미로 항상 새 오브젝트에 올린 뒤 스왑한다.
                val primaryKey = "$id/primary.${UUID.randomUUID()}.${extensionFor(part.contentType)}"
                imageStorage.putObject(primaryKey, part.bytes, normalizeContentType(part.contentType))
                uploadedKeys.add(primaryKey)
                newPrimaryRow = ShopImagePersistenceRow(primaryKey, ShopImageRole.PRIMARY, 0)
            }
            if (hasGalleryReplace) {
                galleryRows = gallery.mapIndexed { index, part ->
                    val sortOrder = existingGalleryImageIds.size + index + 1
                    val key = "$id/gallery-$sortOrder.${UUID.randomUUID()}.${extensionFor(part.contentType)}"
                    imageStorage.putObject(key, part.bytes, normalizeContentType(part.contentType))
                    uploadedKeys.add(key)
                    ShopImagePersistenceRow(key, ShopImageRole.GALLERY, sortOrder)
                }
            }

            val oldKeysRemoved = transactionTemplate.execute {
                port.update(id, shop)
                port.swapShopImageRecords(id, newPrimaryRow, galleryRows, existingGalleryImageIds)
            } ?: emptyList()

            oldKeysRemoved.forEach { key ->
                runCatching { imageStorage.deleteObject(key) }
            }
        } catch (e: Exception) {
            for (key in uploadedKeys) {
                runCatching { imageStorage.deleteObject(key) }.exceptionOrNull()?.let { e.addSuppressed(it) }
            }
            throw e
        }

        val updatedShop = port.findById(id) ?: throw EntityNotFoundException("Shop not found: $id")
        invalidateFacetCache()
        return updatedShop
    }

    @Transactional
    override fun deleteShop(id: Long) {
        port.deleteById(id)
        invalidateFacetCache()
    }

    /**
     * 업로드/메타 저장 실패 후 보장 정리. 전부 best-effort이며, 어떤 단계든 실패해도 다음 단계는 시도한다.
     * 보상 과정 예외만 [original] 에 suppress 된다([original] 은 덮어쓰지 않는다).
     */
    private fun compensateCreateShopWithImagesFailure(original: Exception, shopId: Long, uploadedKeys: List<String>) {
        for (key in uploadedKeys) {
            runCatching { imageStorage.deleteObject(key) }
                .exceptionOrNull()
                ?.let { original.addSuppressed(it) }
        }
        runCatching {
            transactionTemplate.execute {
                port.deleteById(shopId)
            }
        }.exceptionOrNull()
            ?.let { original.addSuppressed(it) }
    }

    private fun validateImageUploadPart(part: ImageUploadPart) {
        val normalized = normalizeContentType(part.contentType)
        if (normalized !in ALLOWED_IMAGE_TYPES) {
            throw BadRequestException("지원하지 않는 이미지 형식입니다. 허용: JPEG, PNG, WebP, GIF")
        }
        ShopImagePayloadValidator.validate(part.bytes, normalized)
    }

    private companion object {
        const val MAX_GALLERY_IMAGES = 6
        const val FACET_CACHE_TTL_MILLIS = 30_000L
        const val FACET_BOUNDS_SCALE = 6
        private val ALLOWED_IMAGE_TYPES = setOf("image/jpeg", "image/png", "image/webp", "image/gif")

        fun normalizeContentType(raw: String): String {
            val base = raw.substringBefore(';').trim().lowercase()
            return if (base == "image/jpg") "image/jpeg" else base
        }

        fun extensionFor(rawContentType: String): String = when (normalizeContentType(rawContentType)) {
            "image/jpeg" -> "jpg"
            "image/png" -> "png"
            "image/webp" -> "webp"
            "image/gif" -> "gif"
            else -> "bin"
        }
    }

    internal fun putFacetCacheForTest(query: ShopFacetQuery, response: ShopFacetResponse, cachedAtMillis: Long) {
        facetCache[normalizeForCacheKey(query)] = CachedFacetResponse(response = response, cachedAtMillis = cachedAtMillis)
    }

    private fun clearFacetCache() {
        facetCache.clear()
    }

    private fun invalidateFacetCache() {
        if (TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.registerSynchronization(
                object : TransactionSynchronization {
                    override fun afterCommit() {
                        clearFacetCache()
                    }
                },
            )
            return
        }
        clearFacetCache()
    }

    private fun normalizeForCacheKey(query: ShopFacetQuery): ShopFacetQuery = query.copy(
        regionIds = query.regionIds.toSet(),
        categoryIds = query.categoryIds.toSet(),
        workIds = query.workIds.toSet(),
        swLat = normalizeBound(query.swLat),
        swLng = normalizeBound(query.swLng),
        neLat = normalizeBound(query.neLat),
        neLng = normalizeBound(query.neLng),
    )

    private fun normalizeBound(value: BigDecimal?): BigDecimal? =
        value?.setScale(FACET_BOUNDS_SCALE, RoundingMode.HALF_UP)

    private data class CachedFacetResponse(
        val response: ShopFacetResponse,
        val cachedAtMillis: Long,
    )
}
