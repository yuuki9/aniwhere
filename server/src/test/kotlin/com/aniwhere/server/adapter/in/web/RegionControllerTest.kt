package com.aniwhere.server.adapter.`in`.web

import com.aniwhere.server.domain.region.model.RegionListItem
import com.aniwhere.server.domain.region.port.`in`.ListRegionsUseCase
import com.ninjasquad.springmockk.MockkBean
import io.mockk.every
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.status

@WebMvcTest(RegionController::class)
@AutoConfigureMockMvc(addFilters = false)
class RegionControllerTest {

    @Autowired
    private lateinit var mvc: MockMvc

    @MockkBean
    private lateinit var useCase: ListRegionsUseCase

    @Test
    fun `GET regions - 지역 목록과 count`() {
        every { useCase.listRegions() } returns listOf(
            RegionListItem(id = 1, name = "홍대", city = "서울", count = 12),
            RegionListItem(id = 2, name = "신촌", city = "서울", count = 0),
        )
        mvc.perform(get("/api/v1/regions"))
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.success").value(true))
            .andExpect(jsonPath("$.data.length()").value(2))
            .andExpect(jsonPath("$.data[0].id").value(1))
            .andExpect(jsonPath("$.data[0].name").value("홍대"))
            .andExpect(jsonPath("$.data[0].city").value("서울"))
            .andExpect(jsonPath("$.data[0].count").value(12))
            .andExpect(jsonPath("$.data[1].count").value(0))
    }
}
