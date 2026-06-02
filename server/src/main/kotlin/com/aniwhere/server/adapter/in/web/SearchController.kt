package com.aniwhere.server.adapter.`in`.web

import com.aniwhere.server.common.dto.ApiResponse
import com.aniwhere.server.common.exception.BadRequestException
import com.aniwhere.server.domain.search.model.SearchAutocompleteResponse
import com.aniwhere.server.domain.search.model.SearchAutocompleteScope
import com.aniwhere.server.domain.search.port.`in`.SearchAutocompleteUseCase
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.tags.Tag
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController

@Tag(name = "Search", description = "검색 보조 API")
@RestController
@RequestMapping("/api/v1/search")
class SearchController(
    private val autocompleteUseCase: SearchAutocompleteUseCase,
) {

    @Operation(
        summary = "검색어 자동완성",
        description = "입력 중 검색어에 대한 LIKE 기반 추천. " +
            "`scope=shop`: `shops.name` 부분 일치(기존 `keyword`와 동일). " +
            "`scope=work`: `works.name` / 애니 `korean_title` 부분 일치(기존 `workKeyword`와 동일 OR). " +
            "기본 `limit=8`, 최대 20.",
    )
    @GetMapping("/autocomplete")
    fun autocomplete(
        @RequestParam q: String,
        @RequestParam scope: String,
        @RequestParam(defaultValue = "8") limit: Int,
    ): ApiResponse<SearchAutocompleteResponse> {
        val parsedScope = try {
            SearchAutocompleteScope.parse(scope)
        } catch (e: IllegalArgumentException) {
            throw BadRequestException(e.message ?: "scope must be shop or work")
        }
        return ApiResponse.ok(autocompleteUseCase.autocomplete(q, parsedScope, limit))
    }
}
