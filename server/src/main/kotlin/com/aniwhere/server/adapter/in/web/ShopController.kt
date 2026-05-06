package com.aniwhere.server.adapter.`in`.web

import com.aniwhere.server.common.dto.ApiResponse
import com.aniwhere.server.common.exception.BadRequestException
import com.aniwhere.server.domain.shop.model.ImageUploadPart
import com.aniwhere.server.domain.shop.model.Shop
import com.aniwhere.server.domain.shop.port.`in`.ShopUseCase
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.tags.Tag
import org.springdoc.core.annotations.ParameterObject
import jakarta.validation.Valid
import jakarta.validation.constraints.NotBlank
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.web.PageableDefault
import org.springframework.http.HttpStatus
import org.springframework.http.MediaType
import org.springframework.web.bind.annotation.*
import org.springframework.web.multipart.MultipartFile
import org.springframework.validation.annotation.Validated
import java.math.BigDecimal

@Tag(name = "Shop", description = "피규어샵 API")
@RestController
@RequestMapping("/api/v1/shops")
@Validated
class ShopController(private val useCase: ShopUseCase) {

    @Operation(summary = "샵 단건 조회")
    @GetMapping("/{id}")
    fun getShop(@PathVariable id: Long) = ApiResponse.ok(useCase.getShop(id))

    @Operation(summary = "샵 검색 (페이징). 결과가 없을 때 `code`·`message` 로 안내. workName 지정 시 `works.name` 과 정확히 일치하는 작품을 취급하는 매장만 포함")
    @GetMapping
    fun searchShops(
        @RequestParam(required = false) regionId: Short?,
        @RequestParam(required = false) category: String?,
        @RequestParam(required = false) keyword: String?,
        @RequestParam(required = false) workName: String?,
        @ParameterObject @PageableDefault(size = 20) pageable: Pageable,
    ): ApiResponse<Page<Shop>> {
        val page = useCase.searchShops(
            regionId,
            category,
            keyword,
            workName?.trim()?.takeIf { it.isNotEmpty() },
            pageable,
        )
        return if (page.totalElements == 0L) {
            ApiResponse.ok(page, EMPTY_SHOP_SEARCH_CODE, EMPTY_SHOP_SEARCH_MESSAGE)
        } else {
            ApiResponse.ok(page)
        }
    }

    @Operation(summary = "샵 등록 (JSON)")
    @PostMapping(consumes = [MediaType.APPLICATION_JSON_VALUE])
    @ResponseStatus(HttpStatus.CREATED)
    fun createShop(@Valid @RequestBody req: ShopRequest) =
        ApiResponse.ok(useCase.createShop(req.toDomain()))

    @Operation(
        summary = "샵 등록 (이미지 포함)",
        description = "multipart: `shop`(JSON), 필수 `coverImage`(대표), 선택 `galleryImages`(동일 필드명으로 여러 개, 최대 6)",
    )
    @PostMapping(consumes = [MediaType.MULTIPART_FORM_DATA_VALUE])
    @ResponseStatus(HttpStatus.CREATED)
    fun createShopWithImages(
        @Valid @RequestPart("shop") shop: ShopRequest,
        @RequestPart("coverImage") coverImage: MultipartFile,
        @RequestPart("galleryImages", required = false) galleryImages: List<MultipartFile>?,
    ) = ApiResponse.ok(
        useCase.createShopWithImages(
            shop.toDomain(),
            coverImage.requireImagePart(),
            galleryImages.orEmpty().filter { !it.isEmpty }.map { it.requireImagePart() },
        ),
    )

    @Operation(summary = "샵 수정")
    @PutMapping("/{id}")
    fun updateShop(@PathVariable id: Long, @Valid @RequestBody req: ShopRequest) =
        ApiResponse.ok(useCase.updateShop(id, req.toDomain()))

    @Operation(summary = "샵 삭제")
    @DeleteMapping("/{id}")
    fun deleteShop(@PathVariable id: Long) = run { useCase.deleteShop(id); ApiResponse.ok() }

    private companion object {
        const val EMPTY_SHOP_SEARCH_CODE = "EMPTY_RESULT"
        const val EMPTY_SHOP_SEARCH_MESSAGE = "선택하신 필터 조건에 맞는 굿즈샵이 없습니다."
    }
}

private fun MultipartFile.requireImagePart(): ImageUploadPart {
    if (isEmpty) throw BadRequestException("빈 이미지 파일입니다.")
    val ct = contentType?.takeIf { it.isNotBlank() }
        ?: throw BadRequestException("이미지 Content-Type 이 없습니다.")
    val base = ct.substringBefore(';').trim().lowercase()
    if (!base.startsWith("image/")) throw BadRequestException("이미지 파일만 업로드할 수 있습니다.")
    return ImageUploadPart(bytes = bytes, contentType = ct)
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
