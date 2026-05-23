package com.aniwhere.server.adapter.`in`.web

import com.aniwhere.server.common.exception.GlobalExceptionHandler
import com.aniwhere.server.config.security.SecurityPrincipal
import com.aniwhere.server.domain.favorite.port.`in`.UserFavoriteUseCase
import com.aniwhere.server.domain.work.model.WorkCatalogItem
import com.aniwhere.server.domain.work.model.WorkType
import com.aniwhere.server.domain.work.port.`in`.ListWorksUseCase
import com.ninjasquad.springmockk.MockkBean
import io.mockk.every
import io.mockk.verify
import org.hamcrest.Matchers.nullValue
import org.junit.jupiter.api.AfterEach
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest
import org.springframework.context.annotation.Import
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken
import org.springframework.security.core.authority.SimpleGrantedAuthority
import org.springframework.security.core.context.SecurityContextHolder
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.status
import java.time.LocalDateTime

@WebMvcTest(WorkController::class)
@AutoConfigureMockMvc(addFilters = false)
@Import(GlobalExceptionHandler::class)
class WorkControllerTest {

    @Autowired
    private lateinit var mvc: MockMvc

    @MockkBean
    private lateinit var useCase: ListWorksUseCase

    @MockkBean
    private lateinit var favoriteUseCase: UserFavoriteUseCase

    @AfterEach
    fun clearContext() {
        SecurityContextHolder.clearContext()
    }

    @Test
    fun `GET works - 카탈로그 목록`() {
        val synced = LocalDateTime.of(2026, 5, 1, 12, 0, 0)
        every { useCase.listWorks(null) } returns listOf(
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

    @Test
    fun `GET works type=ANIMATION - 애니메이션만 반환`() {
        every { useCase.listWorks(WorkType.ANIMATION) } returns listOf(
            WorkCatalogItem(id = 1, name = "원피스", type = WorkType.ANIMATION),
        )
        mvc.perform(get("/api/v1/works").param("type", "ANIMATION"))
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.success").value(true))
            .andExpect(jsonPath("$.data.length()").value(1))
            .andExpect(jsonPath("$.data[0].type").value("ANIMATION"))
    }

    @Test
    fun `GET works type=GAME - 게임만 반환`() {
        every { useCase.listWorks(WorkType.GAME) } returns listOf(
            WorkCatalogItem(id = 2, name = "젤다", type = WorkType.GAME),
        )
        mvc.perform(get("/api/v1/works").param("type", "GAME"))
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.success").value(true))
            .andExpect(jsonPath("$.data.length()").value(1))
            .andExpect(jsonPath("$.data[0].type").value("GAME"))
    }

    @Test
    fun `GET works type=INVALID - 400`() {
        mvc.perform(get("/api/v1/works").param("type", "INVALID"))
            .andExpect(status().isBadRequest)
            .andExpect(jsonPath("$.success").value(false))
            .andExpect(jsonPath("$.message").value("type must be ANIMATION or GAME"))
    }

    @Test
    fun `POST works_{id}_favorite - 작품 즐겨찾기 추가`() {
        mockAuthenticatedUser(101L)
        every { favoriteUseCase.addFavoriteWork(101L, 5) } returns Unit

        mvc.perform(post("/api/v1/works/5/favorite"))
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.success").value(true))

        verify { favoriteUseCase.addFavoriteWork(101L, 5) }
    }

    @Test
    fun `DELETE works_{id}_favorite - 작품 즐겨찾기 삭제`() {
        mockAuthenticatedUser(101L)
        every { favoriteUseCase.removeFavoriteWork(101L, 5) } returns Unit

        mvc.perform(delete("/api/v1/works/5/favorite"))
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.success").value(true))

        verify { favoriteUseCase.removeFavoriteWork(101L, 5) }
    }

    private fun mockAuthenticatedUser(userId: Long) {
        val principal = SecurityPrincipal(userId = userId, role = "ROLE_USER")
        val auth = UsernamePasswordAuthenticationToken(principal, null, listOf(SimpleGrantedAuthority("ROLE_USER")))
        SecurityContextHolder.getContext().authentication = auth
    }
}
