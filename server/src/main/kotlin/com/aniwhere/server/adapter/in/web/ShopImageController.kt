package com.aniwhere.server.adapter.`in`.web

import com.aniwhere.server.common.exception.BadRequestException
import com.aniwhere.server.domain.shop.port.out.ShopImageStoragePort
import org.springframework.http.CacheControl
import org.springframework.http.MediaType
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController
import java.util.concurrent.TimeUnit

@RestController
@RequestMapping("/api/v1/shop-images")
class ShopImageController(
    private val imageStorage: ShopImageStoragePort,
) {
    @GetMapping("/{shopId}/{filename:.+}")
    fun getShopImage(
        @PathVariable shopId: Long,
        @PathVariable filename: String,
    ): ResponseEntity<ByteArray> {
        if (shopId <= 0 || filename.isBlank() || filename.contains("..") || filename.contains('/')) {
            throw BadRequestException("이미지 경로가 올바르지 않습니다.")
        }

        val image = imageStorage.getObject("$shopId/$filename")
        val mediaType = runCatching { MediaType.parseMediaType(image.contentType) }
            .getOrDefault(MediaType.APPLICATION_OCTET_STREAM)

        return ResponseEntity.ok()
            .contentType(mediaType)
            .cacheControl(CacheControl.maxAge(365, TimeUnit.DAYS).cachePublic())
            .header("X-Content-Type-Options", "nosniff")
            .body(image.body)
    }
}
