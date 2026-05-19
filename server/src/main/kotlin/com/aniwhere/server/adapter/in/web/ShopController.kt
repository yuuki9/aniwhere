package com.aniwhere.server.adapter.`in`.web

import com.aniwhere.server.common.dto.ApiResponse
import com.aniwhere.server.common.exception.BadRequestException
import com.aniwhere.server.domain.shop.model.ImageUploadPart
import com.aniwhere.server.domain.shop.model.Shop
import com.aniwhere.server.domain.shop.model.ShopStatus
import com.aniwhere.server.domain.shop.port.`in`.ShopUseCase
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.media.Schema
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

    @Operation(
        summary = "샵 검색 (페이징). 결과가 없을 때 `code`·`message` 로 안내. " +
            "`keyword`: 샵 이름(`shops.name`) 부분 일치(LIKE). " +
            "`workKeyword`: 취급 작품 `works.name` / `works.korean_title` 부분 일치(LIKE, 두 컬럼 OR). " +
            "`workId`: 해당 `works.id` 취급 매장만. " +
            "문자열·`workId` 필터는 함께 주면 AND.",
    )
    @GetMapping
    fun searchShops(
        @RequestParam(required = false) regionId: Short?,
        @RequestParam(required = false) category: String?,
        @RequestParam(required = false) keyword: String?,
        @RequestParam(required = false) workKeyword: String?,
        @RequestParam(required = false) workId: Int?,
        @RequestParam(required = false) status: String?,
        @ParameterObject @PageableDefault(size = 20) pageable: Pageable,
    ): ApiResponse<Page<Shop>> {
        val kw = keyword?.trim()?.takeIf { it.isNotEmpty() }
        val workKw = workKeyword?.trim()?.takeIf { it.isNotEmpty() }
        val page = useCase.searchShops(
            regionId,
            category,
            kw,
            workKw,
            workId,
            status.toShopStatusOrNull(),
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
        description = "multipart/form-data: ShopRequest와 동일한 이름의 텍스트 필드 + 필수 coverImage + 선택 galleryImages(같은 필드명 반복, 최대 6).",
    )
    @PostMapping(consumes = [MediaType.MULTIPART_FORM_DATA_VALUE])
    @ResponseStatus(HttpStatus.CREATED)
    fun createShopWithImages(
        @Valid @ModelAttribute request: ShopCreateMultipartRequest,
    ) = ApiResponse.ok(
        useCase.createShopWithImages(
            request.toShop(),
            request.coverImage.requireImagePart(),
            request.galleryImages.orEmpty().filter { !it.isEmpty }.map { it.requireImagePart() },
        ),
    )

    @Operation(summary = "샵 수정 (JSON)")
    @PutMapping("/{id}", consumes = [MediaType.APPLICATION_JSON_VALUE])
    fun updateShopJson(@PathVariable id: Long, @Valid @RequestBody req: ShopRequest) =
        ApiResponse.ok(useCase.updateShop(id, req.toDomain()))

    @Operation(
        summary = "샵 수정 (텍스트·이미지)",
        description = "multipart: Shop 등록과 같은 텍스트 필드명. coverImage가 있으면 대표 교체. replaceGallery=true이면 galleryImages(반복)로 갤러리 전체 교체(파트 없으면 갤러리 비움).",
    )
    @PutMapping("/{id}", consumes = [MediaType.MULTIPART_FORM_DATA_VALUE])
    fun updateShopWithImages(
        @PathVariable id: Long,
        @Valid @ModelAttribute request: ShopUpdateMultipartRequest,
    ): ApiResponse<Shop> {
        val galleryFiles = request.galleryImages.orEmpty().filter { !it.isEmpty }
        val existingGalleryImageIds = request.existingGalleryImageIds.orEmpty()
        if (!request.replaceGallery && (galleryFiles.isNotEmpty() || existingGalleryImageIds.isNotEmpty())) {
            throw BadRequestException("갤러리 파일은 replaceGallery=true 일 때만 전송할 수 있습니다.")
        }
        val coverUpload = request.coverImage?.takeUnless { it.isEmpty }?.requireImagePart()
        val galleryUploads = if (request.replaceGallery) {
            galleryFiles.map { it.requireImagePart() }
        } else {
            emptyList()
        }
        return ApiResponse.ok(
            useCase.updateShopWithImages(
                id,
                request.toShop(),
                coverUpload,
                request.replaceGallery,
                galleryUploads,
                existingGalleryImageIds,
            ),
        )
    }

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

private fun String?.toShopStatusOrNull(): ShopStatus? {
    val normalized = this?.trim()?.takeIf { it.isNotEmpty() } ?: return null
    return runCatching { ShopStatus.valueOf(normalized.uppercase()) }
        .getOrElse { throw BadRequestException("Invalid shop status: $normalized") }
}

data class ShopRequest(
    @field:NotBlank val name: String,
    @field:NotBlank val address: String,
    val px: BigDecimal,
    val py: BigDecimal,
    val floor: String? = null,
    val regionId: Short? = null,
    val status: String = "UNVERIFIED",
    val visitTip: String? = null,
) {
    fun toDomain() = Shop(
        name = name, address = address, px = px, py = py,
        floor = floor, regionId = regionId,
        status = com.aniwhere.server.domain.shop.model.ShopStatus.valueOf(status.uppercase()),
        visitTip = visitTip,
    )
}

@Schema(description = "multipart 등록: ShopRequest 필드명과 동일한 폼 필드 + coverImage(파일) + galleryImages(파일, 반복)")
data class ShopCreateMultipartRequest(
    @field:NotBlank @Schema(example = "샵 이름") val name: String,
    @field:NotBlank @Schema(example = "서울시 …") val address: String,
    @Schema(example = "127.0276368") val px: BigDecimal,
    @Schema(example = "37.4979462") val py: BigDecimal,
    @Schema(example = "2F") val floor: String? = null,
    @Schema(example = "1") val regionId: Short? = null,
    @Schema(example = "UNVERIFIED", allowableValues = ["ACTIVE", "CLOSED", "UNVERIFIED"])
    val status: String = "UNVERIFIED",
    val visitTip: String? = null,
    val coverImage: MultipartFile,
    val galleryImages: List<MultipartFile>? = null,
) {
    fun toShop(): Shop = ShopRequest(
        name = name,
        address = address,
        px = px,
        py = py,
        floor = floor,
        regionId = regionId,
        status = status,
        visitTip = visitTip,
    ).toDomain()
}

@Schema(
    description = "multipart 수정: 등록과 동일 필드명. 대표 교체 시 coverImage, 갤러리 통째 교체 시 replaceGallery=true 및 galleryImages(비우면 갤러리 전부 삭제).",
)
data class ShopUpdateMultipartRequest(
    @field:NotBlank @Schema(example = "샵 이름") val name: String,
    @field:NotBlank @Schema(example = "서울시 …") val address: String,
    @Schema(example = "127.0276368") val px: BigDecimal,
    @Schema(example = "37.4979462") val py: BigDecimal,
    @Schema(example = "2F") val floor: String? = null,
    @Schema(example = "1") val regionId: Short? = null,
    @Schema(example = "UNVERIFIED", allowableValues = ["ACTIVE", "CLOSED", "UNVERIFIED"])
    val status: String = "UNVERIFIED",
    val visitTip: String? = null,
    @Schema(description = "비워두거나 생략하면 대표 이미지 유지")
    val coverImage: MultipartFile? = null,
    @Schema(description = "true일 때만 galleryImages로 갤러리 통째 교체")
    val replaceGallery: Boolean = false,
    @Schema(description = "replaceGallery=true일 때 유지할 기존 갤러리 이미지 ID 목록")
    val existingGalleryImageIds: List<Long>? = null,
    val galleryImages: List<MultipartFile>? = null,
) {
    fun toShop(): Shop = ShopRequest(
        name = name,
        address = address,
        px = px,
        py = py,
        floor = floor,
        regionId = regionId,
        status = status,
        visitTip = visitTip,
    ).toDomain()
}
