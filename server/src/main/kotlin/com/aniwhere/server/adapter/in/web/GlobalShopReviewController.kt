package com.aniwhere.server.adapter.`in`.web

import com.aniwhere.server.common.dto.ApiResponse
import com.aniwhere.server.config.security.SecurityPrincipal
import com.aniwhere.server.domain.shopreview.port.`in`.ShopReviewUseCase
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.tags.Tag
import org.springframework.security.core.context.SecurityContextHolder
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController

@Tag(name = "Shop Review", description = "피규어샵 리뷰 API")
@RestController
@RequestMapping("/api/v1/reviews")
class GlobalShopReviewController(private val useCase: ShopReviewUseCase) {

    @Operation(summary = "최근 작성 리뷰 조회", description = "전체 매장에서 최근 작성된 VISIBLE 리뷰를 최신순으로 반환합니다.")
    @GetMapping("/recent")
    fun recentReviews(
        @RequestParam(defaultValue = "${ShopReviewUseCase.DEFAULT_RECENT_REVIEW_LIMIT}") limit: Int,
    ) = ApiResponse.ok(useCase.listRecentReviews(limit, currentUserIdOrNull()))

    private fun currentUserIdOrNull(): Long? =
        (SecurityContextHolder.getContext().authentication?.principal as? SecurityPrincipal)?.userId
}
