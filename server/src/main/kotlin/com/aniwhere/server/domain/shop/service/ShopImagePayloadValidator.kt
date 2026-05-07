package com.aniwhere.server.domain.shop.service

import com.aniwhere.server.common.exception.BadRequestException
import java.io.ByteArrayInputStream
import java.nio.ByteBuffer
import java.nio.ByteOrder
import java.nio.charset.StandardCharsets
import java.util.Locale
import javax.imageio.ImageIO

/**
 * multipart의 Content-Type만으로는 임의 바이트를 통과시킬 수 있으므로,
 * 래스터 형식은 ImageIO로 디코딩·형식 대조를 하고 WebP는 컨테이너·비트스트림 청크를 검사합니다.
 */
object ShopImagePayloadValidator {

    fun validate(bytes: ByteArray, normalizedContentType: String) {
        if (bytes.isEmpty()) {
            throw BadRequestException("이미지 파일이 비어 있습니다.")
        }
        when (normalizedContentType) {
            "image/webp" -> validateWebpContainer(bytes)
            "image/jpeg", "image/png", "image/gif" -> validateRasterImageIo(bytes, normalizedContentType)
            else -> throw BadRequestException("지원하지 않는 이미지 형식입니다.")
        }
    }

    private fun validateRasterImageIo(bytes: ByteArray, declaredNormalized: String) {
        try {
            ByteArrayInputStream(bytes).use { stream ->
                val iis = ImageIO.createImageInputStream(stream)
                    ?: throw BadRequestException("이미지 데이터를 읽을 수 없습니다.")
                iis.use {
                    val readers = ImageIO.getImageReaders(it)
                    if (!readers.hasNext()) {
                        throw BadRequestException("이미지를 해석할 수 없습니다. 형식이 손상되었거나 지원하지 않는 파일입니다.")
                    }
                    val reader = readers.next()
                    try {
                        reader.input = iis
                        val format = reader.formatName.lowercase(Locale.ROOT)
                        val expected = when (declaredNormalized) {
                            "image/jpeg" -> setOf("jpeg", "jpg")
                            "image/png" -> setOf("png")
                            "image/gif" -> setOf("gif")
                            else -> emptySet()
                        }
                        if (format !in expected) {
                            throw BadRequestException("업로드 파일의 실제 형식과 Content-Type이 일치하지 않습니다.")
                        }
                        val w = reader.getWidth(0)
                        val h = reader.getHeight(0)
                        if (w < 1 || h < 1) {
                            throw BadRequestException("유효한 이미지 크기가 아닙니다.")
                        }
                        reader.read(0)
                    } finally {
                        reader.dispose()
                    }
                }
            }
        } catch (e: BadRequestException) {
            throw e
        } catch (_: Exception) {
            throw BadRequestException("이미지를 해석할 수 없습니다.")
        }
    }

    private fun validateWebpContainer(bytes: ByteArray) {
        if (bytes.size < 16) {
            throw BadRequestException("WebP 이미지 형식이 아닙니다.")
        }
        if (!fourCcEquals(bytes, 0, "RIFF")) {
            throw BadRequestException("WebP 이미지 형식이 아닙니다.")
        }
        val riffPayload = ByteBuffer.wrap(bytes, 4, 4).order(ByteOrder.LITTLE_ENDIAN).int.toLong() and 0xFFFF_FFFFL
        if (riffPayload < 4L || 8 + riffPayload > bytes.size) {
            throw BadRequestException("WebP 이미지 형식이 아닙니다.")
        }
        if (!fourCcEquals(bytes, 8, "WEBP")) {
            throw BadRequestException("WebP 이미지 형식이 아닙니다.")
        }
        var offset = 12
        var foundBitstreamChunk = false
        while (offset + 8 <= bytes.size) {
            val chunkId = readFourCcAscii(bytes, offset)
            val chunkSize = ByteBuffer.wrap(bytes, offset + 4, 4).order(ByteOrder.LITTLE_ENDIAN).int
            if (chunkSize < 0) {
                throw BadRequestException("WebP 이미지 형식이 아닙니다.")
            }
            val paddedPayload = chunkSize + (chunkSize and 1)
            if (offset + 8L + paddedPayload.toLong() > bytes.size) {
                throw BadRequestException("WebP 이미지 형식이 아닙니다.")
            }
            when (chunkId) {
                "VP8 ", "VP8L" -> {
                    foundBitstreamChunk = true
                    break
                }
            }
            offset += 8 + paddedPayload
        }
        if (!foundBitstreamChunk) {
            throw BadRequestException("WebP 이미지 형식이 아닙니다.")
        }
    }

    private fun fourCcEquals(bytes: ByteArray, offset: Int, ascii: String): Boolean {
        if (offset + ascii.length > bytes.size) return false
        for (i in ascii.indices) {
            if (bytes[offset + i] != ascii[i].code.toByte()) return false
        }
        return true
    }

    private fun readFourCcAscii(bytes: ByteArray, offset: Int): String =
        if (offset + 4 <= bytes.size) {
            String(bytes, offset, 4, StandardCharsets.US_ASCII)
        } else {
            ""
        }
}
