package com.aniwhere.server.adapter.`in`.web

import com.aniwhere.server.common.dto.ApiResponse
import com.aniwhere.server.common.exception.BadRequestException
import com.aniwhere.server.domain.popularity.model.PopularityWindow
import com.aniwhere.server.domain.popularity.port.`in`.PopularityRankingUseCase
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.tags.Tag
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController

@Tag(name = "Rankings", description = "인기 매장·작품·검색어 랭킹 API")
@RestController
@RequestMapping("/api/v1/rankings")
class PopularityRankingController(
    private val useCase: PopularityRankingUseCase,
) {

    @Operation(summary = "인기 매장 랭킹")
    @GetMapping("/shops")
    fun shopRankings(
        @RequestParam(defaultValue = "7d") window: String,
        @RequestParam(defaultValue = "20") limit: Int,
    ) = ApiResponse.ok(useCase.shopRankings(parseWindow(window), limit))

    @Operation(summary = "인기 작품 랭킹")
    @GetMapping("/works")
    fun workRankings(
        @RequestParam(defaultValue = "7d") window: String,
        @RequestParam(defaultValue = "20") limit: Int,
    ) = ApiResponse.ok(useCase.workRankings(parseWindow(window), limit))

    @Operation(summary = "인기 검색어 TOP 랭킹")
    @GetMapping("/search/keywords")
    fun keywordRankings(
        @RequestParam(defaultValue = "7d") window: String,
        @RequestParam(defaultValue = "10") limit: Int,
    ) = ApiResponse.ok(useCase.keywordRankings(parseWindow(window), limit))

    @Operation(summary = "인기 검색 대상(매장·작품) 혼합 TOP 랭킹")
    @GetMapping("/search/entities")
    fun mixedEntityRankings(
        @RequestParam(defaultValue = "7d") window: String,
        @RequestParam(defaultValue = "10") limit: Int,
    ) = ApiResponse.ok(useCase.mixedEntityRankings(parseWindow(window), limit))

    private fun parseWindow(raw: String): PopularityWindow =
        try {
            PopularityWindow.parse(raw)
        } catch (e: IllegalArgumentException) {
            throw BadRequestException(e.message ?: "Invalid window")
        }
}
