package com.aniwhere.server.config

import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Test

class ShopImagesS3PropertiesTest {

    @Test
    fun `resolvePublicUrl - 기본값은 API 이미지 프록시와 s3Key 결합`() {
        val props = ShopImagesS3Properties()
        assertEquals(
            "https://api.aniwhere.link/api/v1/shop-images/99/primary.jpg",
            props.resolvePublicUrl("99/primary.jpg"),
        )
    }

    @Test
    fun `resolvePublicUrl - API 공개 URL 끝 슬래시 제거 후 프록시 경로 결합`() {
        val props = ShopImagesS3Properties(apiPublicUrl = "https://dev-api.aniwhere.link/")
        assertEquals(
            "https://dev-api.aniwhere.link/api/v1/shop-images/1/gallery-2.png",
            props.resolvePublicUrl("1/gallery-2.png"),
        )
    }

    @Test
    fun `resolvePublicUrl - 프록시를 끄면 CloudFront 베이스와 s3Key 결합`() {
        val props = ShopImagesS3Properties(
            bucket = "ignored",
            publicBaseUrl = "https://aniwhere.link/img/shop",
            useApiProxyUrls = false,
        )
        assertEquals(
            "https://aniwhere.link/img/shop/99/primary.jpg",
            props.resolvePublicUrl("99/primary.jpg"),
        )
    }

    @Test
    fun `resolvePublicUrl - 프록시를 끄면 publicBaseUrl 끝 슬래시 제거 후 결합`() {
        val props = ShopImagesS3Properties(
            publicBaseUrl = "https://aniwhere.link/img/shop/",
            useApiProxyUrls = false,
        )
        assertEquals(
            "https://aniwhere.link/img/shop/1/gallery-2.png",
            props.resolvePublicUrl("1/gallery-2.png"),
        )
    }
}
