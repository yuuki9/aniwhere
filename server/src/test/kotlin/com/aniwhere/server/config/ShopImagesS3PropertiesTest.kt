package com.aniwhere.server.config

import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Test

class ShopImagesS3PropertiesTest {

    @Test
    fun `resolvePublicUrl - CloudFront 베이스와 s3Key 결합`() {
        val props = ShopImagesS3Properties(
            bucket = "ignored",
            publicBaseUrl = "https://aniwhere.link/img/shop",
        )
        assertEquals(
            "https://aniwhere.link/img/shop/99/primary.jpg",
            props.resolvePublicUrl("99/primary.jpg"),
        )
    }

    @Test
    fun `resolvePublicUrl - publicBaseUrl 끝 슬래시 제거 후 결합`() {
        val props = ShopImagesS3Properties(publicBaseUrl = "https://aniwhere.link/img/shop/")
        assertEquals(
            "https://aniwhere.link/img/shop/1/gallery-2.png",
            props.resolvePublicUrl("1/gallery-2.png"),
        )
    }
}
