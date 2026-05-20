package com.aniwhere.server.adapter.`in`.web

import com.aniwhere.server.common.dto.ApiResponse
import com.aniwhere.server.domain.region.port.`in`.ListRegionsUseCase
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.tags.Tag
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@Tag(name = "Region", description = "지역 마스터 API")
@RestController
@RequestMapping("/api/v1/regions")
class RegionController(
    private val useCase: ListRegionsUseCase,
) {

    @Operation(summary = "등록된 지역 목록 (name 오름차순). count는 region_id 연결 매장 수(전체 status)")
    @GetMapping
    fun listRegions() = ApiResponse.ok(useCase.listRegions())
}
