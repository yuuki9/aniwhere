package com.aniwhere.server.adapter.`in`.web

import com.aniwhere.server.common.dto.ApiResponse
import com.aniwhere.server.common.exception.BadRequestException
import com.aniwhere.server.common.exception.UnauthorizedException
import com.aniwhere.server.config.security.SecurityPrincipal
import com.aniwhere.server.domain.shop.model.ImageUploadPart
import com.aniwhere.server.domain.shopreview.port.`in`.ShopReviewUseCase
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.tags.Tag
import org.springdoc.core.annotations.ParameterObject
import org.springframework.data.domain.Pageable
import org.springframework.data.web.PageableDefault
import org.springframework.http.HttpStatus
import org.springframework.http.MediaType
import org.springframework.security.core.context.SecurityContextHolder
import org.springframework.web.bind.annotation.GetMapping
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
        @ParameterObject @PageableDefault(size = 20) pageable: Pageable,
    ) = ApiResponse.ok(useCase.listReviews(shopId, pageable))

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

    private fun currentUserId(): Long =
        (SecurityContextHolder.getContext().authentication?.principal as? SecurityPrincipal)?.userId
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
