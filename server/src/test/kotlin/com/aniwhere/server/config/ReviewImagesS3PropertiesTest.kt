package com.aniwhere.server.config

import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Test

class ReviewImagesS3PropertiesTest {

    @Test
    fun `resolvePublicUrl - 기본값은 API 이미지 프록시와 s3Key 결합`() {
        val props = ReviewImagesS3Properties()
        assertEquals(
            "https://api.aniwhere.link/api/v1/review-images/42/gallery-1.jpg",
            props.resolvePublicUrl("img/review/42/gallery-1.jpg"),
        )
    }

    @Test
    fun `resolvePublicUrl - apiPublicUrl 오버라이드`() {
        val props = ReviewImagesS3Properties(apiPublicUrl = "https://dev-api.aniwhere.link")
        assertEquals(
            "https://dev-api.aniwhere.link/api/v1/review-images/10/gallery-2.png",
            props.resolvePublicUrl("img/review/10/gallery-2.png"),
        )
    }
}
