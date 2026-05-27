package com.aniwhere.server.adapter.`in`.web

import com.aniwhere.server.common.dto.ApiResponse
import com.aniwhere.server.domain.shopreview.port.`in`.ShopReviewUseCase
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.tags.Tag
import org.springdoc.core.annotations.ParameterObject
import org.springframework.data.domain.Pageable
import org.springframework.data.web.PageableDefault
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

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
}
