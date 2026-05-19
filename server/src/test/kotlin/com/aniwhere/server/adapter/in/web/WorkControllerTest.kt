package com.aniwhere.server.adapter.`in`.web

import com.aniwhere.server.domain.work.model.WorkCatalogItem
import com.aniwhere.server.domain.work.model.WorkType
import com.aniwhere.server.domain.work.port.`in`.ListWorksUseCase
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
import java.time.LocalDateTime
import org.hamcrest.Matchers.nullValue

@WebMvcTest(WorkController::class)
@AutoConfigureMockMvc(addFilters = false)
class WorkControllerTest {

    @Autowired
    private lateinit var mvc: MockMvc

    @MockkBean
    private lateinit var useCase: ListWorksUseCase

    @Test
    fun `GET works - 카탈로그 목록`() {
        val synced = LocalDateTime.of(2026, 5, 1, 12, 0, 0)
        every { useCase.listWorks() } returns listOf(
            WorkCatalogItem(
                id = 1,
                name = "원피스",
                type = WorkType.ANIMATION,
                anilistId = 21L,
                titleRomaji = "ONE PIECE",
                titleEnglish = "One Piece",
                titleNative = "ワンピース",
                koreanTitle = "원피스",
                genres = listOf("Action", "Adventure"),
                coverUrl = "https://example.com/cover.jpg",
                tmdbLogoUrl = "https://example.com/logo.png",
                popularity = 100,
                anilistSyncedAt = synced,
            ),
            WorkCatalogItem(id = 2, name = "젤다", type = WorkType.GAME),
        )
        mvc.perform(get("/api/v1/works"))
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.success").value(true))
            .andExpect(jsonPath("$.data.length()").value(2))
            .andExpect(jsonPath("$.data[0].id").value(1))
            .andExpect(jsonPath("$.data[0].name").value("원피스"))
            .andExpect(jsonPath("$.data[0].anilistId").value(21))
            .andExpect(jsonPath("$.data[0].titleRomaji").value("ONE PIECE"))
            .andExpect(jsonPath("$.data[0].genres[0]").value("Action"))
            .andExpect(jsonPath("$.data[0].anilistSyncedAt").value("2026-05-01T12:00:00"))
            .andExpect(jsonPath("$.data[0].type").value("ANIMATION"))
            .andExpect(jsonPath("$.data[1].name").value("젤다"))
            .andExpect(jsonPath("$.data[1].type").value("GAME"))
            .andExpect(jsonPath("$.data[1].anilistId").value(nullValue()))
    }
}
