package com.aniwhere.server.adapter.`in`.web

import com.aniwhere.server.common.exception.BadRequestException
import com.aniwhere.server.config.ReviewImagesS3Properties
import com.aniwhere.server.domain.shop.port.out.StoredShopImage
import com.aniwhere.server.domain.shopreview.port.out.ReviewImageStoragePort
import org.junit.jupiter.api.Assertions.assertArrayEquals
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertThrows
import org.junit.jupiter.api.Test
import org.springframework.http.HttpStatus
import org.springframework.http.MediaType

class ReviewImageControllerTest {

    @Test
    fun `getReviewImage - reviewId filename으로 S3 이미지를 스트리밍한다`() {
        val imageBytes = byteArrayOf(4, 5, 6)
        val controller = ReviewImageController(
            object : ReviewImageStoragePort {
                override fun putObject(key: String, body: ByteArray, contentType: String) = error("not used")
                override fun getObject(key: String): StoredShopImage {
                    assertEquals("${ReviewImagesS3Properties.KEY_PREFIX}/42/gallery-1.jpg", key)
                    return StoredShopImage(imageBytes, "image/jpeg")
                }
                override fun deleteObject(key: String) = error("not used")
            },
        )

        val response = controller.getReviewImage(42, "gallery-1.jpg")

        assertEquals(HttpStatus.OK, response.statusCode)
        assertEquals(MediaType.IMAGE_JPEG, response.headers.contentType)
        assertEquals("nosniff", response.headers.getFirst("X-Content-Type-Options"))
        assertArrayEquals(imageBytes, response.body)
    }

    @Test
    fun `getReviewImage - 올바르지 않은 이미지 경로는 거절한다`() {
        val controller = ReviewImageController(
            object : ReviewImageStoragePort {
                override fun putObject(key: String, body: ByteArray, contentType: String) = error("not used")
                override fun getObject(key: String) = error("not used")
                override fun deleteObject(key: String) = error("not used")
            },
        )

        assertThrows(BadRequestException::class.java) {
            controller.getReviewImage(42, "../gallery-1.jpg")
        }
    }
}
