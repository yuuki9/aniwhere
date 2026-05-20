package com.aniwhere.server.adapter.`in`.web

import com.aniwhere.server.common.dto.ApiResponse
import com.aniwhere.server.domain.category.port.`in`.ListCategoriesUseCase
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.tags.Tag
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@Tag(name = "Category", description = "카테고리 마스터 API")
@RestController
@RequestMapping("/api/v1/categories")
class CategoryController(
    private val useCase: ListCategoriesUseCase,
) {

    @Operation(summary = "등록된 카테고리 목록 (name 오름차순). count는 category 연결 매장 수(전체 status)")
    @GetMapping
    fun listCategories() = ApiResponse.ok(useCase.listCategories())
}
