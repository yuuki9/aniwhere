package com.aniwhere.server.adapter.`in`.web

import com.aniwhere.server.common.exception.BadRequestException
import com.aniwhere.server.domain.shop.port.out.ShopImageStoragePort
import com.aniwhere.server.domain.shop.port.out.StoredShopImage
import org.junit.jupiter.api.Assertions.assertArrayEquals
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertThrows
import org.junit.jupiter.api.Test
import org.springframework.http.HttpStatus
import org.springframework.http.MediaType

class ShopImageControllerTest {

    @Test
    fun `getShopImage - shopId와 filename으로 S3 이미지를 스트리밍한다`() {
        val imageBytes = byteArrayOf(1, 2, 3)
        val controller = ShopImageController(
            object : ShopImageStoragePort {
                override fun putObject(key: String, body: ByteArray, contentType: String) = error("not used")
                override fun getObject(key: String): StoredShopImage {
                    assertEquals("1/primary.jpg", key)
                    return StoredShopImage(imageBytes, "image/jpeg")
                }
                override fun deleteObject(key: String) = error("not used")
            },
        )

        val response = controller.getShopImage(1, "primary.jpg")

        assertEquals(HttpStatus.OK, response.statusCode)
        assertEquals(MediaType.IMAGE_JPEG, response.headers.contentType)
        assertEquals("nosniff", response.headers.getFirst("X-Content-Type-Options"))
        assertArrayEquals(imageBytes, response.body)
    }

    @Test
    fun `getShopReviewImage - shopId reviewId filename으로 S3 이미지를 스트리밍한다`() {
        val imageBytes = byteArrayOf(4, 5, 6)
        val controller = ShopImageController(
            object : ShopImageStoragePort {
                override fun putObject(key: String, body: ByteArray, contentType: String) = error("not used")
                override fun getObject(key: String): StoredShopImage {
                    assertEquals("1/reviews/42/abc.jpg", key)
                    return StoredShopImage(imageBytes, "image/jpeg")
                }
                override fun deleteObject(key: String) = error("not used")
            },
        )

        val response = controller.getShopReviewImage(1, 42, "abc.jpg")

        assertEquals(HttpStatus.OK, response.statusCode)
        assertEquals(MediaType.IMAGE_JPEG, response.headers.contentType)
        assertEquals("nosniff", response.headers.getFirst("X-Content-Type-Options"))
        assertArrayEquals(imageBytes, response.body)
    }

    @Test
    fun `getShopImage - 올바르지 않은 이미지 경로는 거절한다`() {
        val controller = ShopImageController(
            object : ShopImageStoragePort {
                override fun putObject(key: String, body: ByteArray, contentType: String) = error("not used")
                override fun getObject(key: String) = error("not used")
                override fun deleteObject(key: String) = error("not used")
            },
        )

        assertThrows(BadRequestException::class.java) {
            controller.getShopImage(1, "../primary.jpg")
        }
    }
}
