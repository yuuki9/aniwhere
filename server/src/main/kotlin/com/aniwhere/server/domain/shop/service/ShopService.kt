package com.aniwhere.server.domain.shop.service

import com.aniwhere.server.common.exception.BadRequestException
import com.aniwhere.server.common.exception.EntityNotFoundException
import com.aniwhere.server.config.ShopImagesS3Properties
import com.aniwhere.server.domain.shop.model.ImageUploadPart
import com.aniwhere.server.domain.shop.model.Shop
import com.aniwhere.server.domain.shop.model.ShopImageRole
import com.aniwhere.server.domain.shop.port.`in`.ShopUseCase
import com.aniwhere.server.domain.shop.port.out.ShopImagePersistenceRow
import com.aniwhere.server.domain.shop.port.out.ShopImageStoragePort
import com.aniwhere.server.domain.shop.port.out.ShopPersistencePort
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
@Transactional(readOnly = true)
class ShopService(
    private val port: ShopPersistencePort,
    private val imageStorage: ShopImageStoragePort,
    private val shopImagesS3: ShopImagesS3Properties,
) : ShopUseCase {

    override fun getShop(id: Long) =
        port.findById(id) ?: throw EntityNotFoundException("Shop not found: $id")

    override fun searchShops(regionId: Short?, categoryName: String?, keyword: String?, workName: String?, pageable: Pageable): Page<Shop> =
        port.findAll(regionId, categoryName, keyword, workName, pageable)

    @Transactional
    override fun createShop(shop: Shop) = port.save(shop)

    @Transactional
    override fun createShopWithImages(shop: Shop, cover: ImageUploadPart, gallery: List<ImageUploadPart>): Shop {
        if (shopImagesS3.bucket.trim().isEmpty()) {
            throw BadRequestException("S3 버킷(app.s3.shop-images.bucket)이 설정되지 않았습니다.")
        }
        assertAllowedImage(cover.contentType)
        if (gallery.size > MAX_GALLERY_IMAGES) {
            throw BadRequestException("갤러리 이미지는 최대 ${MAX_GALLERY_IMAGES}장까지 등록할 수 있습니다.")
        }
        gallery.forEach { assertAllowedImage(it.contentType) }

        val saved = port.save(shop.copy(id = null))
        val id = saved.id ?: error("Shop id missing after save")

        val primaryKey = "shops/$id/primary.${extensionFor(cover.contentType)}"
        imageStorage.putObject(primaryKey, cover.bytes, normalizeContentType(cover.contentType))

        val rows = mutableListOf(
            ShopImagePersistenceRow(s3Key = primaryKey, role = ShopImageRole.PRIMARY, sortOrder = 0),
        )
        gallery.forEachIndexed { index, part ->
            val key = "shops/$id/gallery/${index + 1}.${extensionFor(part.contentType)}"
            imageStorage.putObject(key, part.bytes, normalizeContentType(part.contentType))
            rows.add(ShopImagePersistenceRow(s3Key = key, role = ShopImageRole.GALLERY, sortOrder = index + 1))
        }
        port.saveShopImageRecords(id, rows)
        return port.findById(id) ?: throw EntityNotFoundException("Shop not found: $id")
    }

    @Transactional
    override fun updateShop(id: Long, shop: Shop) = port.update(id, shop)

    @Transactional
    override fun deleteShop(id: Long) = port.deleteById(id)

    private companion object {
        const val MAX_GALLERY_IMAGES = 6
        private val ALLOWED_IMAGE_TYPES = setOf("image/jpeg", "image/png", "image/webp", "image/gif")

        fun normalizeContentType(raw: String): String {
            val base = raw.substringBefore(';').trim().lowercase()
            return if (base == "image/jpg") "image/jpeg" else base
        }

        fun assertAllowedImage(rawContentType: String) {
            val t = normalizeContentType(rawContentType)
            if (t !in ALLOWED_IMAGE_TYPES) {
                throw BadRequestException("지원하지 않는 이미지 형식입니다. 허용: JPEG, PNG, WebP, GIF")
            }
        }

        fun extensionFor(rawContentType: String): String = when (normalizeContentType(rawContentType)) {
            "image/jpeg" -> "jpg"
            "image/png" -> "png"
            "image/webp" -> "webp"
            "image/gif" -> "gif"
            else -> "bin"
        }
    }
}
