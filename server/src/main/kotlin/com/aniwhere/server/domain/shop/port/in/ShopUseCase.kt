package com.aniwhere.server.domain.shop.port.`in`

import com.aniwhere.server.domain.shop.model.ImageUploadPart
import com.aniwhere.server.domain.shop.model.Shop
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable

interface ShopUseCase {
    fun getShop(id: Long): Shop
    fun searchShops(regionId: Short?, categoryName: String?, keyword: String?, workName: String?, pageable: Pageable): Page<Shop>
    fun createShop(shop: Shop): Shop
    fun createShopWithImages(shop: Shop, cover: ImageUploadPart, gallery: List<ImageUploadPart>): Shop
    fun updateShop(id: Long, shop: Shop): Shop
    /**
     * [coverImage]가 있으면 대표 이미지를 교체합니다.
     * [replaceGallery]가 true면 [gallery](0~MAX장) 내용으로 갤러리를 통째로 바꿉니다(미전송 파일이 없으면 갤러리 비움).
     * 둘 다 없으면 메타 데이터([shop])만 갱신합니다.
     */
    fun updateShopWithImages(
        id: Long,
        shop: Shop,
        coverImage: ImageUploadPart?,
        replaceGallery: Boolean,
        gallery: List<ImageUploadPart>,
    ): Shop
    fun deleteShop(id: Long)
}
