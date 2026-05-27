package com.aniwhere.server.adapter.`in`.web

import com.aniwhere.server.domain.shop.model.Shop
import com.aniwhere.server.domain.shop.model.ShopFacetResponse
import com.aniwhere.server.domain.shop.model.ShopStatus
import com.aniwhere.server.domain.shop.model.FacetCategoryItem
import com.aniwhere.server.domain.shop.model.FacetRegionItem
import com.aniwhere.server.domain.shop.model.FacetWorkTypeItem
import com.aniwhere.server.domain.shop.port.`in`.ShopUseCase
import com.aniwhere.server.domain.favorite.port.`in`.UserFavoriteUseCase
import com.aniwhere.server.config.security.SecurityPrincipal
import com.aniwhere.server.domain.shop.service.ShopServiceTest
import com.aniwhere.server.domain.category.model.CategorySummary
import com.aniwhere.server.domain.work.model.WorkSummary
import com.aniwhere.server.domain.work.model.WorkType
import com.fasterxml.jackson.databind.ObjectMapper
import com.ninjasquad.springmockk.MockkBean
import io.mockk.every
import io.mockk.slot
import io.mockk.verify
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.AfterEach
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest
import org.springframework.data.domain.PageImpl
import org.springframework.data.domain.PageRequest
import org.springframework.http.HttpMethod
import org.springframework.http.MediaType
import org.springframework.mock.web.MockMultipartFile
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken
import org.springframework.security.core.authority.SimpleGrantedAuthority
import org.springframework.security.core.context.SecurityContextHolder
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.*
import java.math.BigDecimal

@WebMvcTest(ShopController::class)
@AutoConfigureMockMvc(addFilters = false)
class ShopControllerTest {

    @Autowired
    private lateinit var mvc: MockMvc

    @Autowired
    private lateinit var mapper: ObjectMapper

    @MockkBean
    private lateinit var useCase: ShopUseCase

    @MockkBean
    private lateinit var favoriteUseCase: UserFavoriteUseCase

    @AfterEach
    fun clearContext() {
        SecurityContextHolder.clearContext()
    }

    private val sampleShop = Shop(
        id = 1L, name = "테스트샵", address = "서울시 강남구",
        px = BigDecimal("127.0276368"), py = BigDecimal("37.4979462"),
        status = ShopStatus.ACTIVE,
        categories = listOf(CategorySummary(id = 1, name = "피규어")),
        works = listOf(WorkSummary(id = 1, name = "원피스", coverUrl = "https://example.com/c.jpg")),
    )

    @Test
    fun `GET shops_{id} - categories는 id와 name 객체 배열`() {
        every { useCase.getShop(1L) } returns sampleShop
        mvc.perform(get("/api/v1/shops/1"))
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.data.categories[0].id").value(1))
            .andExpect(jsonPath("$.data.categories[0].name").value("피규어"))
            .andExpect(jsonPath("$.data.categoryIds").doesNotExist())
            .andExpect(jsonPath("$.data.workIds").doesNotExist())
    }

    @Test
    fun `GET shops_{id} - 샵 단건 조회`() {
        every { useCase.getShop(1L) } returns sampleShop
        mvc.perform(get("/api/v1/shops/1"))
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.success").value(true))
            .andExpect(jsonPath("$.data.name").value("테스트샵"))
            .andExpect(jsonPath("$.data.works[0].id").value(1))
            .andExpect(jsonPath("$.data.works[0].name").value("원피스"))
            .andExpect(jsonPath("$.data.works[0].coverUrl").value("https://example.com/c.jpg"))
    }

    @Test
    fun `GET shops_{id} - averageRating과 reviewCount를 반환한다`() {
        every { useCase.getShop(1L) } returns sampleShop.copy(
            averageRating = BigDecimal("4.25"),
            reviewCount = 12,
        )
        mvc.perform(get("/api/v1/shops/1"))
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.data.averageRating").value(4.25))
            .andExpect(jsonPath("$.data.reviewCount").value(12))
    }

    @Test
    fun `GET shops - 샵 페이징 검색`() {
        every { useCase.searchShops(any(), any(), any(), any(), any(), any(), any(), any()) } returns PageImpl(listOf(sampleShop))
        mvc.perform(get("/api/v1/shops").param("keyword", "테스트").param("page", "0").param("size", "20"))
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.data.content.length()").value(1))
            .andExpect(jsonPath("$.data.content[0].works[0].id").value(1))
            .andExpect(jsonPath("$.data.content[0].works[0].name").value("원피스"))
            .andExpect(jsonPath("$.data.totalElements").value(1))
            .andExpect(jsonPath("$.code").doesNotExist())
            .andExpect(jsonPath("$.message").doesNotExist())
        verify { useCase.searchShops(emptySet(), emptySet(), "테스트", null, emptySet(), null, null, any()) }
    }

    @Test
    fun `GET shops - 검색 결과에 averageRating과 reviewCount를 반환한다`() {
        val shopWithRating = sampleShop.copy(
            averageRating = BigDecimal("4.50"),
            reviewCount = 8,
        )
        every { useCase.searchShops(any(), any(), any(), any(), any(), any(), any(), any()) } returns PageImpl(listOf(shopWithRating))
        mvc.perform(get("/api/v1/shops").param("page", "0").param("size", "20"))
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.data.content[0].averageRating").value(4.50))
            .andExpect(jsonPath("$.data.content[0].reviewCount").value(8))
    }

    @Test
    fun `GET shops - keyword 앞뒤 공백은 trim 후 전달`() {
        every { useCase.searchShops(emptySet(), emptySet(), "원피스", null, emptySet(), null, null, any()) } returns PageImpl(listOf(sampleShop))
        mvc.perform(
            get("/api/v1/shops")
                .param("keyword", " 원피스 ")
                .param("page", "0")
                .param("size", "20"),
        )
            .andExpect(status().isOk)
        verify { useCase.searchShops(emptySet(), emptySet(), "원피스", null, emptySet(), null, null, any()) }
    }

    @Test
    fun `GET shops - workIds 를 그대로 유스케이스에 전달`() {
        every { useCase.searchShops(emptySet(), emptySet(), null, null, setOf(42), null, null, any()) } returns PageImpl(listOf(sampleShop))
        mvc.perform(
            get("/api/v1/shops")
                .param("workIds", "42")
                .param("page", "0")
                .param("size", "20"),
        )
            .andExpect(status().isOk)
        verify { useCase.searchShops(emptySet(), emptySet(), null, null, setOf(42), null, null, any()) }
    }

    @Test
    fun `GET shops - workKeyword 앞뒤 공백은 trim 후 전달`() {
        every { useCase.searchShops(emptySet(), emptySet(), null, "주술회전", emptySet(), null, null, any()) } returns PageImpl(listOf(sampleShop))
        mvc.perform(
            get("/api/v1/shops")
                .param("workKeyword", " 주술회전 ")
                .param("page", "0")
                .param("size", "20"),
        )
            .andExpect(status().isOk)
        verify { useCase.searchShops(emptySet(), emptySet(), null, "주술회전", emptySet(), null, null, any()) }
    }

    @Test
    fun `GET shops - status 필터를 domain enum으로 전달`() {
        every { useCase.searchShops(emptySet(), emptySet(), null, null, emptySet(), null, ShopStatus.ACTIVE, any()) } returns PageImpl(listOf(sampleShop))
        mvc.perform(get("/api/v1/shops").param("status", "ACTIVE").param("page", "0").param("size", "20"))
            .andExpect(status().isOk)
        verify { useCase.searchShops(emptySet(), emptySet(), null, null, emptySet(), null, ShopStatus.ACTIVE, any()) }
    }

    @Test
    fun `GET shops - 검색 결과가 없으면 code 와 안내 메시지`() {
        val pageable = PageRequest.of(0, 20)
        every { useCase.searchShops(any(), any(), any(), any(), any(), any(), any(), any()) } returns PageImpl(emptyList(), pageable, 0)
        mvc.perform(get("/api/v1/shops").param("page", "0").param("size", "20"))
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.success").value(true))
            .andExpect(jsonPath("$.code").value("EMPTY_RESULT"))
            .andExpect(jsonPath("$.message").value("선택하신 필터 조건에 맞는 굿즈샵이 없습니다."))
            .andExpect(jsonPath("$.data.totalElements").value(0))
    }

    @Test
    fun `GET shops - keyword 가 공백만이면 필터 미적용(null)`() {
        every { useCase.searchShops(emptySet(), emptySet(), null, null, emptySet(), null, null, any()) } returns PageImpl(emptyList())
        mvc.perform(get("/api/v1/shops").param("keyword", "   ").param("page", "0").param("size", "20"))
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.code").value("EMPTY_RESULT"))
        verify { useCase.searchShops(emptySet(), emptySet(), null, null, emptySet(), null, null, any()) }
    }

    @Test
    fun `GET shops - regionIds와 categoryIds를 함께 전달하면 둘 다 유스케이스로 전달`() {
        every {
            useCase.searchShops(
                setOf<Short>(1, 2),
                setOf<Short>(1, 2),
                null,
                null,
                emptySet(),
                null,
                null,
                any(),
            )
        } returns PageImpl(listOf(sampleShop))

        mvc.perform(
            get("/api/v1/shops")
                .param("regionIds", "1", "2")
                .param("categoryIds", "1", "2")
                .param("page", "0")
                .param("size", "20"),
        )
            .andExpect(status().isOk)

        verify {
            useCase.searchShops(
                setOf<Short>(1, 2),
                setOf<Short>(1, 2),
                null,
                null,
                emptySet(),
                null,
                null,
                any(),
            )
        }
    }

    @Test
    fun `GET shops - workType 앞뒤 공백은 trim 후 enum으로 전달`() {
        every {
            useCase.searchShops(emptySet(), emptySet(), null, null, emptySet(), WorkType.GAME, null, any())
        } returns PageImpl(listOf(sampleShop))

        mvc.perform(
            get("/api/v1/shops")
                .param("workType", " game ")
                .param("page", "0")
                .param("size", "20"),
        )
            .andExpect(status().isOk)

        verify { useCase.searchShops(emptySet(), emptySet(), null, null, emptySet(), WorkType.GAME, null, any()) }
    }

    @Test
    fun `GET shops - workType 값이 잘못되면 400`() {
        mvc.perform(
            get("/api/v1/shops")
                .param("workType", "novel")
                .param("page", "0")
                .param("size", "20"),
        )
            .andExpect(status().isBadRequest)
    }

    @Test
    fun `GET shops_facets - 응답은 regions categories workTypes 배열을 포함`() {
        every { useCase.getShopFacets(true, true, true) } returns ShopFacetResponse(
            regions = listOf(FacetRegionItem(id = 1, name = "홍대")),
            categories = listOf(FacetCategoryItem(id = 2, name = "굿즈")),
            workTypes = listOf(FacetWorkTypeItem(value = "GAME", label = "게임")),
        )

        mvc.perform(get("/api/v1/shops/facets"))
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.data.regions[0].id").value(1))
            .andExpect(jsonPath("$.data.categories[0].id").value(2))
            .andExpect(jsonPath("$.data.workTypes[0].value").value("GAME"))
            .andExpect(jsonPath("$.data.works").doesNotExist())
            .andExpect(jsonPath("$.data.statuses").doesNotExist())
    }

    @Test
    fun `GET shops_facets - 파라미터 없이 옵션 목록 조회`() {
        every { useCase.getShopFacets(true, true, true) } returns ShopFacetResponse()

        mvc.perform(get("/api/v1/shops/facets"))
            .andExpect(status().isOk)

        verify { useCase.getShopFacets(true, true, true) }
    }

    @Test
    fun `GET shops_facets - include 파라미터로 요소 포함 여부를 제어`() {
        every { useCase.getShopFacets(false, true, false) } returns ShopFacetResponse(
            regions = emptyList(),
            categories = listOf(FacetCategoryItem(id = 2, name = "굿즈")),
            workTypes = emptyList(),
        )

        mvc.perform(
            get("/api/v1/shops/facets")
                .param("includeRegions", "false")
                .param("includeCategories", "true")
                .param("includeWorkTypes", "false"),
        )
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.data.regions.length()").value(0))
            .andExpect(jsonPath("$.data.categories[0].id").value(2))
            .andExpect(jsonPath("$.data.workTypes.length()").value(0))

        verify { useCase.getShopFacets(false, true, false) }
    }

    @Test
    fun `POST shops - categoryIds와 workIds를 useCase에 전달`() {
        every { useCase.createShop(any()) } returns sampleShop
        val req = ShopRequest(
            name = "테스트샵",
            address = "서울시 강남구",
            px = BigDecimal("127.0276368"),
            py = BigDecimal("37.4979462"),
            categoryIds = listOf(1, 2),
            workIds = listOf(10, 20),
        )
        val captured = slot<Shop>()
        every { useCase.createShop(capture(captured)) } returns sampleShop

        mvc.perform(
            post("/api/v1/shops")
                .contentType(MediaType.APPLICATION_JSON)
                .content(mapper.writeValueAsString(req)),
        )
            .andExpect(status().isCreated)

        assertEquals(listOf<Short>(1, 2), captured.captured.categoryIds)
        assertEquals(listOf(10, 20), captured.captured.workIds)
    }

    @Test
    fun `PUT shops_{id} - categoryIds와 workIds를 useCase에 전달`() {
        val updated = sampleShop.copy(name = "수정된샵")
        val req = ShopRequest(
            name = "수정된샵",
            address = "서울시 강남구",
            px = BigDecimal("127.0276368"),
            py = BigDecimal("37.4979462"),
            categoryIds = listOf(3),
            workIds = listOf(42),
        )
        val captured = slot<Shop>()
        every { useCase.updateShop(1L, capture(captured)) } returns updated

        mvc.perform(
            put("/api/v1/shops/1")
                .contentType(MediaType.APPLICATION_JSON)
                .content(mapper.writeValueAsString(req)),
        )
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.data.name").value("수정된샵"))

        assertEquals(listOf<Short>(3), captured.captured.categoryIds)
        assertEquals(listOf(42), captured.captured.workIds)
    }

    @Test
    fun `POST shops - 샵 등록`() {
        every { useCase.createShop(any()) } returns sampleShop
        val req = ShopRequest(
            name = "테스트샵", address = "서울시 강남구",
            px = BigDecimal("127.0276368"), py = BigDecimal("37.4979462"),
        )
        mvc.perform(
            post("/api/v1/shops")
                .contentType(MediaType.APPLICATION_JSON)
                .content(mapper.writeValueAsString(req))
        )
            .andExpect(status().isCreated)
            .andExpect(jsonPath("$.data.id").value(1))
    }

    @Test
    fun `PUT shops_{id} - 샵 수정`() {
        val updated = sampleShop.copy(name = "수정된샵")
        every { useCase.updateShop(1L, any()) } returns updated
        val req = ShopRequest(
            name = "수정된샵", address = "서울시 강남구",
            px = BigDecimal("127.0276368"), py = BigDecimal("37.4979462"),
        )
        mvc.perform(
            put("/api/v1/shops/1")
                .contentType(MediaType.APPLICATION_JSON)
                .content(mapper.writeValueAsString(req)),
        )
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.data.name").value("수정된샵"))
    }

    @Test
    fun `PUT shops_{id} multipart - replaceGallery 없이 갤러리 파일이 있으면 400`() {
        val png = MockMultipartFile("galleryImages", "a.png", "image/png", ShopServiceTest.minimalPngBytes)
        mvc.perform(
            multipart(HttpMethod.PUT, "/api/v1/shops/1")
                .file(png)
                .param("name", "테스트샵")
                .param("address", "주소")
                .param("px", "127.0276368")
                .param("py", "37.4979462"),
        )
            .andExpect(status().isBadRequest)
        verify(exactly = 0) { useCase.updateShopWithImages(any(), any(), any(), any(), any(), any()) }
    }

    @Test
    fun `PUT shops_{id} multipart - replaceGallery 로 갤러리 업데이트`() {
        val gallery = MockMultipartFile("galleryImages", "a.png", "image/png", ShopServiceTest.minimalPngBytes)
        every {
            useCase.updateShopWithImages(1L, any(), null, true, match { it.size == 1 }, emptyList())
        } returns sampleShop.copy()

        mvc.perform(
            multipart(HttpMethod.PUT, "/api/v1/shops/1")
                .file(gallery)
                .param("name", "테스트샵")
                .param("address", "주소")
                .param("px", "127.0276368")
                .param("py", "37.4979462")
                .param("replaceGallery", "true"),
        )
            .andExpect(status().isOk)

        verify { useCase.updateShopWithImages(1L, any(), null, true, match { it.size == 1 }, emptyList()) }
    }

    @Test
    fun `DELETE shops_{id} - 샵 삭제`() {
        every { useCase.deleteShop(1L) } returns Unit
        mvc.perform(delete("/api/v1/shops/1"))
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.success").value(true))
        verify { useCase.deleteShop(1L) }
    }

    @Test
    fun `POST shops_{id}_favorite - 샵 즐겨찾기 추가`() {
        mockAuthenticatedUser(88L)
        every { favoriteUseCase.addFavoriteShop(88L, 1L) } returns Unit

        mvc.perform(post("/api/v1/shops/1/favorite"))
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.success").value(true))

        verify { favoriteUseCase.addFavoriteShop(88L, 1L) }
    }

    @Test
    fun `DELETE shops_{id}_favorite - 샵 즐겨찾기 삭제`() {
        mockAuthenticatedUser(88L)
        every { favoriteUseCase.removeFavoriteShop(88L, 1L) } returns Unit

        mvc.perform(delete("/api/v1/shops/1/favorite"))
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.success").value(true))

        verify { favoriteUseCase.removeFavoriteShop(88L, 1L) }
    }

    @Test
    fun `POST shops - validation 실패시 400`() {
        val req = mapOf("name" to "", "address" to "", "px" to 0, "py" to 0)
        mvc.perform(
            post("/api/v1/shops")
                .contentType(MediaType.APPLICATION_JSON)
                .content(mapper.writeValueAsString(req))
        )
            .andExpect(status().isBadRequest)
    }

    private fun mockAuthenticatedUser(userId: Long) {
        val principal = SecurityPrincipal(userId = userId, role = "ROLE_USER")
        val auth = UsernamePasswordAuthenticationToken(principal, null, listOf(SimpleGrantedAuthority("ROLE_USER")))
        SecurityContextHolder.getContext().authentication = auth
    }
}
