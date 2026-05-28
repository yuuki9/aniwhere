package com.aniwhere.server.adapter.`in`.web

import com.aniwhere.server.common.exception.GlobalExceptionHandler
import com.aniwhere.server.config.security.SecurityPrincipal
import com.aniwhere.server.domain.shopreview.model.ShopReview
import com.aniwhere.server.domain.shopreview.model.ShopReviewStatus
import com.aniwhere.server.domain.shopreview.port.`in`.ShopReviewUseCase
import com.fasterxml.jackson.databind.ObjectMapper
import com.ninjasquad.springmockk.MockkBean
import io.mockk.every
import io.mockk.verify
import org.junit.jupiter.api.AfterEach
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest
import org.springframework.context.annotation.Import
import org.springframework.http.MediaType
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken
import org.springframework.security.core.authority.SimpleGrantedAuthority
import org.springframework.security.core.context.SecurityContextHolder
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.status
import java.time.LocalDateTime

@WebMvcTest(AdminShopReviewController::class)
@AutoConfigureMockMvc(addFilters = false)
@Import(GlobalExceptionHandler::class)
class AdminShopReviewControllerTest {

    @Autowired
    private lateinit var mvc: MockMvc

    @Autowired
    private lateinit var mapper: ObjectMapper

    @MockkBean
    private lateinit var useCase: ShopReviewUseCase

    private val sampleReview = ShopReview(
        id = 5L,
        shopId = 1L,
        authorUserId = 10L,
        authorNickname = "테스트유저",
        rating = 4,
        content = "좋은 샵이에요",
        status = ShopReviewStatus.HIDDEN,
        createdAt = LocalDateTime.now(),
    )

    @AfterEach
    fun tearDown() {
        SecurityContextHolder.clearContext()
    }

    @Test
    fun `PATCH admin shop review status - admin이면 200`() {
        mockAuthenticatedUser(1L, "ROLE_ADMIN")
        every {
            useCase.updateReviewStatus(1L, 1L, 5L, ShopReviewStatus.HIDDEN)
        } returns sampleReview

        mvc.perform(
            patch("/api/v1/admin/shops/1/reviews/5/status")
                .contentType(MediaType.APPLICATION_JSON)
                .content(mapper.writeValueAsString(ShopReviewStatusRequest(ShopReviewStatus.HIDDEN))),
        )
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.success").value(true))
            .andExpect(jsonPath("$.data.status").value("HIDDEN"))

        verify { useCase.updateReviewStatus(1L, 1L, 5L, ShopReviewStatus.HIDDEN) }
    }

    private fun mockAuthenticatedUser(userId: Long, role: String) {
        val principal = SecurityPrincipal(userId = userId, role = role)
        val auth = UsernamePasswordAuthenticationToken(principal, null, listOf(SimpleGrantedAuthority(role)))
        SecurityContextHolder.getContext().authentication = auth
    }
}
