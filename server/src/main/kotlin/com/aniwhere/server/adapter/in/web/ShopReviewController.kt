package com.aniwhere.server.adapter.`in`.web

import com.aniwhere.server.common.dto.ApiResponse
import com.aniwhere.server.common.exception.BadRequestException
import com.aniwhere.server.common.exception.UnauthorizedException
import com.aniwhere.server.config.security.SecurityPrincipal
import com.aniwhere.server.domain.shop.model.ImageUploadPart
import com.aniwhere.server.domain.shopreview.model.ShopReview
import com.aniwhere.server.domain.shopreview.model.ShopReviewSort
import com.aniwhere.server.domain.shopreview.port.`in`.ShopReviewUseCase
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.tags.Tag
import org.springdoc.core.annotations.ParameterObject
import org.springframework.data.domain.Pageable
import org.springframework.data.web.PageableDefault
import org.springframework.http.HttpStatus
import org.springframework.http.MediaType
import org.springframework.security.core.context.SecurityContextHolder
import org.springframework.web.bind.annotation.DeleteMapping
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PatchMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RequestPart
import org.springframework.web.bind.annotation.ResponseStatus
import org.springframework.web.bind.annotation.RestController
import org.springframework.web.multipart.MultipartFile

@Tag(name = "Shop Review", description = "피규어샵 리뷰 API")
@RestController
@RequestMapping("/api/v1/shops/{shopId}/reviews")
class ShopReviewController(private val useCase: ShopReviewUseCase) {

    @Operation(summary = "샵 리뷰 목록 조회")
    @GetMapping
    fun listReviews(
        @PathVariable shopId: Long,
        @RequestParam(defaultValue = "NEWEST") sort: ShopReviewSort,
        @ParameterObject @PageableDefault(size = 20) pageable: Pageable,
    ) = ApiResponse.ok(useCase.listReviews(shopId, sort, pageable, currentUserIdOrNull()))

    @Operation(summary = "샵 리뷰 작성")
    @PostMapping(consumes = [MediaType.MULTIPART_FORM_DATA_VALUE])
    @ResponseStatus(HttpStatus.CREATED)
    fun createReview(
        @PathVariable shopId: Long,
        @RequestParam(required = false) rating: Int?,
        @RequestParam content: String,
        @RequestPart(required = false) images: List<MultipartFile>?,
    ) = ApiResponse.ok(
        useCase.createReview(
            currentUserId(),
            shopId,
            rating ?: throw BadRequestException("rating is required"),
            content.trim(),
            images.orEmpty().filter { !it.isEmpty }.map { it.requireImagePart() },
        ),
    )

    @Operation(
        summary = "샵 리뷰 수정",
        description = "multipart: rating/content는 선택. replaceImages=true일 때 existingImageIds(반복)로 유지·순서 지정, images(반복)로 신규 file[] 추가. replaceImages=true이고 둘 다 비우면 이미지 전부 삭제.",
    )
    @PatchMapping(value = ["/{reviewId}"], consumes = [MediaType.MULTIPART_FORM_DATA_VALUE])
    fun updateReview(
        @PathVariable shopId: Long,
        @PathVariable reviewId: Long,
        @RequestParam(required = false) rating: Int?,
        @RequestParam(required = false) content: String?,
        @RequestParam(required = false, defaultValue = "false") replaceImages: Boolean,
        @RequestParam(required = false) existingImageIds: List<Long>?,
        @RequestPart(required = false) images: List<MultipartFile>?,
    ): ApiResponse<ShopReview> {
        val imageFiles = images.orEmpty().filter { !it.isEmpty }
        val retainedImageIds = existingImageIds.orEmpty()
        if (!replaceImages && (imageFiles.isNotEmpty() || retainedImageIds.isNotEmpty())) {
            throw BadRequestException("이미지 변경은 replaceImages=true 일 때만 images 또는 existingImageIds를 전송할 수 있습니다.")
        }
        val imageUploads = if (replaceImages) {
            imageFiles.map { it.requireImagePart() }
        } else {
            emptyList()
        }
        return ApiResponse.ok(
            useCase.updateReview(
                currentUserId(),
                shopId,
                reviewId,
                rating,
                content?.trim(),
                replaceImages,
                imageUploads,
                retainedImageIds,
            ),
        )
    }

    @Operation(summary = "샵 리뷰 삭제")
    @DeleteMapping("/{reviewId}")
    fun deleteReview(
        @PathVariable shopId: Long,
        @PathVariable reviewId: Long,
    ) = run {
        useCase.deleteReview(currentUserId(), shopId, reviewId)
        ApiResponse.ok()
    }

    @Operation(summary = "샵 리뷰 좋아요")
    @PostMapping("/{reviewId}/likes")
    @ResponseStatus(HttpStatus.CREATED)
    fun likeReview(
        @PathVariable shopId: Long,
        @PathVariable reviewId: Long,
    ) = run {
        useCase.likeReview(currentUserId(), shopId, reviewId)
        ApiResponse.ok()
    }

    @Operation(summary = "샵 리뷰 좋아요 취소")
    @DeleteMapping("/{reviewId}/likes")
    fun unlikeReview(
        @PathVariable shopId: Long,
        @PathVariable reviewId: Long,
    ) = run {
        useCase.unlikeReview(currentUserId(), shopId, reviewId)
        ApiResponse.ok()
    }

    private fun currentUserIdOrNull(): Long? =
        (SecurityContextHolder.getContext().authentication?.principal as? SecurityPrincipal)?.userId

    private fun currentUserId(): Long = currentUserIdOrNull()
        ?: throw UnauthorizedException("Authentication required")
}

private fun MultipartFile.requireImagePart(): ImageUploadPart {
    if (isEmpty) throw BadRequestException("빈 이미지 파일입니다.")
    val ct = contentType?.takeIf { it.isNotBlank() }
        ?: throw BadRequestException("이미지 Content-Type 이 없습니다.")
    val base = ct.substringBefore(';').trim().lowercase()
    if (!base.startsWith("image/")) throw BadRequestException("이미지 파일만 업로드할 수 있습니다.")
    return ImageUploadPart(bytes = bytes, contentType = ct)
}
