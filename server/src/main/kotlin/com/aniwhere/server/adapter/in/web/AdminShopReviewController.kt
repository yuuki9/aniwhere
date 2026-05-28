package com.aniwhere.server.adapter.`in`.web

import com.aniwhere.server.common.dto.ApiResponse
import com.aniwhere.server.common.exception.UnauthorizedException
import com.aniwhere.server.config.security.SecurityPrincipal
import com.aniwhere.server.domain.shopreview.model.ShopReviewStatus
import com.aniwhere.server.domain.shopreview.port.`in`.ShopReviewUseCase
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.tags.Tag
import jakarta.validation.Valid
import jakarta.validation.constraints.NotNull
import org.springframework.security.core.context.SecurityContextHolder
import org.springframework.web.bind.annotation.PatchMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@Tag(name = "Shop Review Admin", description = "피규어샵 리뷰 관리자 API")
@RestController
@RequestMapping("/api/v1/admin/shops/{shopId}/reviews")
class AdminShopReviewController(private val useCase: ShopReviewUseCase) {

    @Operation(summary = "샵 리뷰 상태 변경")
    @PatchMapping("/{reviewId}/status")
    fun updateStatus(
        @PathVariable shopId: Long,
        @PathVariable reviewId: Long,
        @Valid @RequestBody req: ShopReviewStatusRequest,
    ) = ApiResponse.ok(useCase.updateReviewStatus(currentUserId(), shopId, reviewId, req.status))

    private fun currentUserId(): Long =
        (SecurityContextHolder.getContext().authentication?.principal as? SecurityPrincipal)?.userId
            ?: throw UnauthorizedException("Authentication required")
}

data class ShopReviewStatusRequest(
    @field:NotNull val status: ShopReviewStatus,
)
