package com.aniwhere.server.domain.shop.service

import com.aniwhere.server.common.exception.BadRequestException
import com.aniwhere.server.common.exception.EntityNotFoundException
import com.aniwhere.server.domain.shop.model.ImageUploadPart
import com.aniwhere.server.domain.shop.model.Shop
import com.aniwhere.server.domain.shop.model.ShopFacetResponse
import com.aniwhere.server.domain.shop.model.ShopImageRole
import com.aniwhere.server.domain.shop.model.ShopSort
import com.aniwhere.server.domain.shop.model.ShopStatus
import com.aniwhere.server.domain.shop.model.toPageable
import com.aniwhere.server.domain.work.model.WorkType
import com.aniwhere.server.domain.shop.port.`in`.ShopUseCase
import com.aniwhere.server.domain.shop.port.out.ShopImagePersistenceRow
import com.aniwhere.server.domain.shop.port.out.ShopImageStoragePort
import com.aniwhere.server.domain.shop.port.out.ShopPersistencePort
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Propagation
import org.springframework.transaction.annotation.Transactional
import org.springframework.transaction.support.TransactionTemplate
import java.math.BigDecimal
import java.util.UUID
import kotlin.math.atan2
import kotlin.math.abs
import kotlin.math.cos
import kotlin.math.pow
import kotlin.math.sin
import kotlin.math.sqrt

@Service
@Transactional(readOnly = true)
class ShopService(
    private val port: ShopPersistencePort,
    private val imageStorage: ShopImageStoragePort,
    private val transactionTemplate: TransactionTemplate,
) : ShopUseCase {
    override fun getShop(id: Long) =
        port.findById(id) ?: throw EntityNotFoundException("Shop not found: $id")

    override fun getNearbyShops(
        latitude: BigDecimal,
        longitude: BigDecimal,
        radiusKm: BigDecimal,
    ): List<Shop> {
        val lat = latitude.toDouble()
        val lng = longitude.toDouble()
        val radius = radiusKm.toDouble()
        validateNearbyRequest(lat, lng, radius)

        val bounds = calculateNearbyBounds(lat, lng, radius)
        return port.findWithinBounds(bounds.swLat, bounds.swLng, bounds.neLat, bounds.neLng)
            .mapNotNull { shop ->
                val distanceKm = haversineKm(lat, lng, shop.py.toDouble(), shop.px.toDouble())
                if (distanceKm <= radius) {
                    shop to distanceKm
                } else {
                    null
                }
            }
            .sortedBy { it.second }
            .map { it.first }
    }

    override fun getShopFacets(
        includeRegions: Boolean,
        includeCategories: Boolean,
        includeWorkTypes: Boolean,
        includeSorts: Boolean,
    ): ShopFacetResponse = port.findFacets(
        includeRegions = includeRegions,
        includeCategories = includeCategories,
        includeWorkTypes = includeWorkTypes,
        includeSorts = includeSorts,
    )

    override fun searchShops(
        regionIds: Set<Short>,
        categoryIds: Set<Short>,
        keyword: String?,
        workKeyword: String?,
        workIds: Set<Int>,
        workType: WorkType?,
        status: ShopStatus?,
        sort: ShopSort,
        pageable: Pageable,
    ): Page<Shop> =
        port.findAll(
            regionIds,
            categoryIds,
            keyword,
            workKeyword,
            workIds,
            workType,
            status,
            sort.toPageable(pageable),
        )

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
        const val EARTH_RADIUS_KM = 6371.0
        const val LATITUDE_KM_PER_DEGREE = 111.32
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

        private fun validateNearbyRequest(latitude: Double, longitude: Double, radiusKm: Double) {
            if (!latitude.isFinite() || latitude !in -90.0..90.0) {
                throw BadRequestException("lat must be between -90 and 90.")
            }
            if (!longitude.isFinite() || longitude !in -180.0..180.0) {
                throw BadRequestException("lng must be between -180 and 180.")
            }
            if (!radiusKm.isFinite() || radiusKm <= 0.0) {
                throw BadRequestException("radiusKm must be greater than 0.")
            }
        }

        private fun calculateNearbyBounds(latitude: Double, longitude: Double, radiusKm: Double): NearbyBoundsDecimal {
            val latDelta = radiusKm / LATITUDE_KM_PER_DEGREE
            val lngDenominator = LATITUDE_KM_PER_DEGREE * cos(Math.toRadians(latitude)).let {
                if (it == 0.0) Double.MIN_VALUE else abs(it)
            }
            val lngDelta = radiusKm / lngDenominator
            return NearbyBoundsDecimal(
                swLat = (latitude - latDelta).coerceAtLeast(-90.0).toBigDecimal(),
                swLng = (longitude - lngDelta).coerceAtLeast(-180.0).toBigDecimal(),
                neLat = (latitude + latDelta).coerceAtMost(90.0).toBigDecimal(),
                neLng = (longitude + lngDelta).coerceAtMost(180.0).toBigDecimal(),
            )
        }

        private fun haversineKm(fromLat: Double, fromLng: Double, toLat: Double, toLng: Double): Double {
            val latDistance = Math.toRadians(toLat - fromLat)
            val lngDistance = Math.toRadians(toLng - fromLng)
            val startLat = Math.toRadians(fromLat)
            val endLat = Math.toRadians(toLat)
            val a = sin(latDistance / 2).pow(2.0) + sin(lngDistance / 2).pow(2.0) * cos(startLat) * cos(endLat)
            return EARTH_RADIUS_KM * 2 * atan2(sqrt(a), sqrt(1 - a))
        }
    }

    private data class NearbyBoundsDecimal(
        val swLat: BigDecimal,
        val swLng: BigDecimal,
        val neLat: BigDecimal,
        val neLng: BigDecimal,
    )

    private fun invalidateFacetCache() = Unit
}
