package com.aniwhere.server.adapter.`in`.web

import com.aniwhere.server.domain.work.model.WorkCatalogItem
import com.aniwhere.server.domain.work.port.`in`.ListWorksUseCase
import com.ninjasquad.springmockk.MockkBean
import io.mockk.every
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.status

@WebMvcTest(WorkController::class)
class WorkControllerTest {

    @Autowired
    private lateinit var mvc: MockMvc

    @MockkBean
    private lateinit var useCase: ListWorksUseCase

    @Test
    fun `GET works - 카탈로그 목록`() {
        every { useCase.listWorks() } returns listOf(WorkCatalogItem(1, "원피스"), WorkCatalogItem(2, "주술회전"))
        mvc.perform(get("/api/v1/works"))
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.success").value(true))
            .andExpect(jsonPath("$.data.length()").value(2))
            .andExpect(jsonPath("$.data[0].id").value(1))
            .andExpect(jsonPath("$.data[0].name").value("원피스"))
    }
}
