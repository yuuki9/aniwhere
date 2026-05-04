package com.aniwhere.server.adapter.`in`.web

import com.aniwhere.server.common.dto.ApiResponse
import com.aniwhere.server.domain.work.port.`in`.ListWorksUseCase
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.tags.Tag
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@Tag(name = "Work", description = "작품(works) 마스터 API")
@RestController
@RequestMapping("/api/v1/works")
class WorkController(
    private val useCase: ListWorksUseCase,
) {

    @Operation(summary = "등록된 작품 목록 (이름 순). 샵 검색 시 workName 과 동일한 문자열 사용")
    @GetMapping
    fun listWorks() = ApiResponse.ok(useCase.listWorks())
}
