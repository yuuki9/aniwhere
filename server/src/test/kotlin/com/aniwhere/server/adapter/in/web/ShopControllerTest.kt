package com.aniwhere.server.adapter.`in`.web

import com.aniwhere.server.domain.shop.model.Shop
import com.aniwhere.server.domain.shop.model.ShopStatus
import com.aniwhere.server.domain.shop.port.`in`.ShopUseCase
import com.fasterxml.jackson.databind.ObjectMapper
import com.ninjasquad.springmockk.MockkBean
import io.mockk.every
import io.mockk.verify
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest
import org.springframework.data.domain.PageImpl
import org.springframework.http.MediaType
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.*
import java.math.BigDecimal

@WebMvcTest(ShopController::class)
class ShopControllerTest {

    @Autowired
    private lateinit var mvc: MockMvc

    @Autowired
    private lateinit var mapper: ObjectMapper

    @MockkBean
    private lateinit var useCase: ShopUseCase

    private val sampleShop = Shop(
        id = 1L, name = "테스트샵", address = "서울시 강남구",
        px = BigDecimal("127.0276368"), py = BigDecimal("37.4979462"),
        status = ShopStatus.ACTIVE,
    )

    @Test
    fun `GET shops_{id} - 샵 단건 조회`() {
        every { useCase.getShop(1L) } returns sampleShop
        mvc.perform(get("/api/v1/shops/1"))
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.success").value(true))
            .andExpect(jsonPath("$.data.name").value("테스트샵"))
    }

    @Test
    fun `GET shops - 샵 페이징 검색`() {
        every { useCase.searchShops(any(), any(), any(), any(), any()) } returns PageImpl(listOf(sampleShop))
        mvc.perform(get("/api/v1/shops").param("keyword", "테스트").param("page", "0").param("size", "20"))
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.data.content.length()").value(1))
            .andExpect(jsonPath("$.data.totalElements").value(1))
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
                .content(mapper.writeValueAsString(req))
        )
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.data.name").value("수정된샵"))
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
    fun `POST shops - validation 실패시 400`() {
        val req = mapOf("name" to "", "address" to "", "px" to 0, "py" to 0)
        mvc.perform(
            post("/api/v1/shops")
                .contentType(MediaType.APPLICATION_JSON)
                .content(mapper.writeValueAsString(req))
        )
            .andExpect(status().isBadRequest)
    }
}
