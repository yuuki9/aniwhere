package com.aniwhere.server.domain.shop.port.`in`

import com.aniwhere.server.domain.shop.model.ImageUploadPart
import com.aniwhere.server.domain.shop.model.ShopFacetResponse
import com.aniwhere.server.domain.shop.model.Shop
import com.aniwhere.server.domain.shop.model.ShopStatus
import com.aniwhere.server.domain.work.model.WorkType
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import java.math.BigDecimal

interface ShopUseCase {
    fun getShop(id: Long): Shop
    fun getNearbyShops(latitude: BigDecimal, longitude: BigDecimal, radiusKm: BigDecimal): List<Shop>
    fun getShopFacets(
        includeRegions: Boolean = true,
        includeCategories: Boolean = true,
        includeWorkTypes: Boolean = true,
    ): ShopFacetResponse
    fun searchShops(
        regionIds: Set<Short>,
        categoryIds: Set<Short>,
        keyword: String?,
        workKeyword: String?,
        workIds: Set<Int>,
        workType: WorkType?,
        status: ShopStatus?,
        pageable: Pageable,
    ): Page<Shop>
    fun createShop(shop: Shop): Shop
    fun createShopWithImages(shop: Shop, cover: ImageUploadPart, gallery: List<ImageUploadPart>): Shop
    fun updateShop(id: Long, shop: Shop): Shop
    /**
     * [coverImage]가 있으면 대표 이미지를 교체합니다.
     * [replaceGallery]가 true면 [gallery](0~MAX장) 내용으로 갤러리를 통째로 바꿉니다(미전송 파일이 없으면 갤러리 비움).
     * [replaceGallery]가 false이면 [gallery]는 비어 있어야 합니다.
     * 둘 다 없으면 메타 데이터([shop])만 갱신합니다.
     * 이미지가 있는 요청에서는 이미지 검증을 DB 반영보다 앞두고, `update`와 이미지 행 교체는 한 트랜잭션에서 처리합니다.
     * 수정 시 S3는 기존 고정 키를 덮어쓰지 않고 UUID가 들어간 새 키에 먼저 올린 뒤, 커밋 성공 후에만 스왑으로 빠진 예전 키를 삭제합니다(업로드는 트랜잭션 밖).
     */
    fun updateShopWithImages(
        id: Long,
        shop: Shop,
        coverImage: ImageUploadPart?,
        replaceGallery: Boolean,
        gallery: List<ImageUploadPart>,
        existingGalleryImageIds: List<Long> = emptyList(),
    ): Shop
    fun deleteShop(id: Long)
}
