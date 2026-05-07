package com.aniwhere.server.domain.shop.service

import com.aniwhere.server.common.exception.BadRequestException
import org.junit.jupiter.api.Assertions.assertDoesNotThrow
import org.junit.jupiter.api.Assertions.assertEquals
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
    fun `VP8 손실 키프레임 시그니처가 있는 최소 WebP 통과`() {
        assertDoesNotThrow {
            ShopImagePayloadValidator.validate(minimalVp8StructuralWebp(), "image/webp")
        }
    }

    @Test
    fun `VP8L 시그니처가 있는 최소 WebP 통과`() {
        assertDoesNotThrow {
            ShopImagePayloadValidator.validate(minimalVp8lStructuralWebp(), "image/webp")
        }
    }

    @Test
    fun `RIFF 크기 필드와 실제 파일 크기 불일치면 거절`() {
        val base = minimalVp8StructuralWebp()
        val tooLong = base + byteArrayOf(0)
        assertThrows<BadRequestException> {
            ShopImagePayloadValidator.validate(tooLong, "image/webp")
        }
    }

    @Test
    fun `VP8 청크에 키프레임 시작 시그니처가 없으면 거절`() {
        assertThrows<BadRequestException> {
            ShopImagePayloadValidator.validate(webpVp8ChunkWithPayload(ByteArray(10)), "image/webp")
        }
    }

    @Test
    fun `청크 크기가 선언 RIFF 길이와 맞지 않으면 거절`() {
        val out = ByteArrayOutputStream()
        out.write("RIFF".toByteArray(StandardCharsets.US_ASCII))
        out.write(leInt(22))
        out.write("WEBP".toByteArray(StandardCharsets.US_ASCII))
        out.write("VP8 ".toByteArray(StandardCharsets.US_ASCII))
        out.write(leInt(50))
        out.write(ByteArray(10))
        val file = out.toByteArray()
        assertEquals(30, file.size)
        assertThrows<BadRequestException> {
            ShopImagePayloadValidator.validate(file, "image/webp")
        }
    }

    @Test
    fun `VP8 비트스트림 청크 없는 WebP 머리만 있으면 거절`() {
        assertThrows<BadRequestException> {
            val riffPayload = ByteArrayOutputStream().use { riff ->
                riff.write("RIFF".toByteArray(StandardCharsets.US_ASCII))
                riff.write(leInt(4))
                riff.write("WEBP".toByteArray(StandardCharsets.US_ASCII))
                riff.toByteArray()
            }
            ShopImagePayloadValidator.validate(riffPayload, "image/webp")
        }
    }

    companion object {

        fun minimalVp8StructuralWebp(): ByteArray =
            webpVp8ChunkWithPayload(
                ByteArray(10).also {
                    it[0] = 0x9D.toByte()
                    it[1] = 0x01.toByte()
                    it[2] = 0x2A.toByte()
                },
            )

        fun minimalVp8lStructuralWebp(): ByteArray {
            val vp8lPayload = byteArrayOf(0x2F, 1, 2, 3, 4)
            val chunkSize = vp8lPayload.size
            val pad = chunkSize and 1
            val riffPayloadSize = 4 + 8 + chunkSize + pad
            val out = ByteArrayOutputStream()
            out.write("RIFF".toByteArray(StandardCharsets.US_ASCII))
            out.write(leInt(riffPayloadSize))
            out.write("WEBP".toByteArray(StandardCharsets.US_ASCII))
            out.write("VP8L".toByteArray(StandardCharsets.US_ASCII))
            out.write(leInt(chunkSize))
            out.write(vp8lPayload)
            if (pad == 1) {
                out.write(0)
            }
            return out.toByteArray()
        }

        private fun webpVp8ChunkWithPayload(payload: ByteArray): ByteArray =
            ByteArrayOutputStream().also { buildRiffVp8To(it, payload) }.toByteArray()

        private fun buildRiffVp8To(out: ByteArrayOutputStream, vp8Payload: ByteArray) {
            val pad = vp8Payload.size and 1
            val riffPayloadSize = 4 + 8 + vp8Payload.size + pad
            out.write("RIFF".toByteArray(StandardCharsets.US_ASCII))
            out.write(leInt(riffPayloadSize))
            out.write("WEBP".toByteArray(StandardCharsets.US_ASCII))
            out.write("VP8 ".toByteArray(StandardCharsets.US_ASCII))
            out.write(leInt(vp8Payload.size))
            out.write(vp8Payload)
            if (pad == 1) {
                out.write(0)
            }
        }

        private fun leInt(n: Int): ByteArray =
            ByteBuffer.allocate(4).order(ByteOrder.LITTLE_ENDIAN).putInt(n).array()
    }
}
