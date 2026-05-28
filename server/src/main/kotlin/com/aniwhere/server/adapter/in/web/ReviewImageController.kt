package com.aniwhere.server.adapter.`in`.web

import com.aniwhere.server.common.exception.BadRequestException
import com.aniwhere.server.config.ReviewImagesS3Properties
import com.aniwhere.server.domain.shopreview.port.out.ReviewImageStoragePort
import org.springframework.http.CacheControl
import org.springframework.http.MediaType
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController
import java.util.concurrent.TimeUnit

@RestController
@RequestMapping("/api/v1/review-images")
class ReviewImageController(
    private val imageStorage: ReviewImageStoragePort,
) {
    @GetMapping("/{reviewId}/{filename:.+}")
    fun getReviewImage(
        @PathVariable reviewId: Long,
        @PathVariable filename: String,
    ): ResponseEntity<ByteArray> {
        if (reviewId <= 0) {
            throw BadRequestException("이미지 경로가 올바르지 않습니다.")
        }
        validateFilename(filename)
        val storageKey = "${ReviewImagesS3Properties.KEY_PREFIX}/$reviewId/$filename"
        val image = imageStorage.getObject(storageKey)
        val mediaType = runCatching { MediaType.parseMediaType(image.contentType) }
            .getOrDefault(MediaType.APPLICATION_OCTET_STREAM)

        return ResponseEntity.ok()
            .contentType(mediaType)
            .cacheControl(CacheControl.maxAge(365, TimeUnit.DAYS).cachePublic())
            .header("X-Content-Type-Options", "nosniff")
            .body(image.body)
    }

    private fun validateFilename(filename: String) {
        if (filename.isBlank() || filename.contains("..") || filename.contains('/')) {
            throw BadRequestException("이미지 경로가 올바르지 않습니다.")
        }
    }
}
