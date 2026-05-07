package com.aniwhere.server.domain.shop.service

import com.aniwhere.server.common.exception.BadRequestException
import org.junit.jupiter.api.Assertions.assertDoesNotThrow
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.assertThrows
import java.io.ByteArrayOutputStream
import java.nio.ByteBuffer
import java.nio.ByteOrder
import java.nio.charset.StandardCharsets

class ShopImagePayloadValidatorTest {

    @Test
    fun `JPEG로 선언한 PNG 바이트는 거절`() {
        assertThrows<BadRequestException> {
            ShopImagePayloadValidator.validate(ShopServiceTest.minimalPngBytes, "image/jpeg")
        }
    }

    @Test
    fun `PNG 바이트는 image_png 로 통과`() {
        assertDoesNotThrow {
            ShopImagePayloadValidator.validate(ShopServiceTest.minimalPngBytes, "image/png")
        }
    }

    @Test
    fun `ImageIO 디코드 가능 JPEG는 통과`() {
        assertDoesNotThrow {
            ShopImagePayloadValidator.validate(ShopServiceTest.tinyValidJpeg, "image/jpeg")
        }
    }

    @Test
    fun `무작위 바이트 JPEG 선언은 거절`() {
        assertThrows<BadRequestException> {
            ShopImagePayloadValidator.validate(byteArrayOf(0xFF.toByte(), 0xD8.toByte(), 0x00), "image/jpeg")
        }
    }

    @Test
    fun `구조적인 WebP 컨테이너 검사 통과`() {
        assertDoesNotThrow {
            ShopImagePayloadValidator.validate(minimalStructuralWebp(), "image/webp")
        }
    }

    @Test
    fun `VP8 비트스트림 청크 없는 WebP 머리만 있으면 거절`() {
        assertThrows<BadRequestException> {
            val riffPayload = ByteArrayOutputStream().use { riff ->
                riff.write("RIFF".toByteArray(StandardCharsets.US_ASCII))
                riff.write(ByteBuffer.allocate(4).order(ByteOrder.LITTLE_ENDIAN).putInt(4).array())
                riff.write("WEBP".toByteArray(StandardCharsets.US_ASCII))
                riff.toByteArray()
            }
            ShopImagePayloadValidator.validate(riffPayload, "image/webp")
        }
    }

    companion object {

        /** RIFF 웹 헤더 + 빈 손실 VP8 청크 크기 명세(내용 무시 불가 디코더는 없음; 컨테이너 경계 검사만). */
        fun minimalStructuralWebp(): ByteArray {
            val payload = ByteArray(10)
            val chunkSize = 10
            val riffPayloadSize = 4 + 8 + chunkSize
            val out = ByteArrayOutputStream()
            out.write("RIFF".toByteArray(StandardCharsets.US_ASCII))
            out.write(ByteBuffer.allocate(4).order(ByteOrder.LITTLE_ENDIAN).putInt(riffPayloadSize).array())
            out.write("WEBP".toByteArray(StandardCharsets.US_ASCII))
            out.write("VP8 ".toByteArray(StandardCharsets.US_ASCII))
            out.write(ByteBuffer.allocate(4).order(ByteOrder.LITTLE_ENDIAN).putInt(chunkSize).array())
            out.write(payload)
            return out.toByteArray()
        }
    }
}
