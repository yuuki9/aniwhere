package com.aniwhere.server.adapter.`in`.web

import com.aniwhere.server.common.dto.ApiResponse
import com.aniwhere.server.domain.shop.model.Shop
import com.aniwhere.server.domain.shop.port.`in`.ShopUseCase
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.tags.Tag
import org.springdoc.core.annotations.ParameterObject
import jakarta.validation.Valid
import jakarta.validation.constraints.NotBlank
import org.springframework.data.domain.Pageable
import org.springframework.data.web.PageableDefault
import org.springframework.http.HttpStatus
import org.springframework.web.bind.annotation.*
import java.math.BigDecimal

@Tag(name = "Shop", description = "피규어샵 API")
@RestController
@RequestMapping("/api/v1/shops")
class ShopController(private val useCase: ShopUseCase) {

    @Operation(summary = "샵 단건 조회")
    @GetMapping("/{id}")
    fun getShop(@PathVariable id: Long) = ApiResponse.ok(useCase.getShop(id))

    @Operation(summary = "샵 검색 (페이징). workName 지정 시 `works.name` 과 정확히 일치하는 작품을 취급하는 매장만 포함")
    @GetMapping
    fun searchShops(
        @RequestParam(required = false) regionId: Short?,
        @RequestParam(required = false) category: String?,
        @RequestParam(required = false) keyword: String?,
        @RequestParam(required = false) workName: String?,
        @ParameterObject @PageableDefault(size = 20) pageable: Pageable,
    ) = ApiResponse.ok(useCase.searchShops(regionId, category, keyword, workName?.takeIf { it.isNotBlank() }, pageable))

    @Operation(summary = "샵 등록")
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    fun createShop(@Valid @RequestBody req: ShopRequest) =
        ApiResponse.ok(useCase.createShop(req.toDomain()))

    @Operation(summary = "샵 수정")
    @PutMapping("/{id}")
    fun updateShop(@PathVariable id: Long, @Valid @RequestBody req: ShopRequest) =
        ApiResponse.ok(useCase.updateShop(id, req.toDomain()))

    @Operation(summary = "샵 삭제")
    @DeleteMapping("/{id}")
    fun deleteShop(@PathVariable id: Long) = run { useCase.deleteShop(id); ApiResponse.ok() }
}

data class ShopRequest(
    @field:NotBlank val name: String,
    @field:NotBlank val address: String,
    val px: BigDecimal,
    val py: BigDecimal,
    val floor: String? = null,
    val regionId: Short? = null,
    val status: String = "UNVERIFIED",
    val sellsIchibanKuji: Boolean? = null,
    val visitTip: String? = null,
) {
    fun toDomain() = Shop(
        name = name, address = address, px = px, py = py,
        floor = floor, regionId = regionId,
        status = com.aniwhere.server.domain.shop.model.ShopStatus.valueOf(status.uppercase()),
        sellsIchibanKuji = sellsIchibanKuji,
        visitTip = visitTip,
    )
}
