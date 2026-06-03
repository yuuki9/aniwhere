package com.aniwhere.server.adapter.`in`.web

import com.aniwhere.server.config.security.SecurityPrincipal
import com.aniwhere.server.domain.popularity.port.`in`.PopularityEventUseCase
import com.fasterxml.jackson.databind.ObjectMapper
import com.ninjasquad.springmockk.MockkBean
import io.mockk.justRun
import io.mockk.verify
import org.junit.jupiter.api.AfterEach
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest
import org.springframework.http.MediaType
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken
import org.springframework.security.core.authority.SimpleGrantedAuthority
import org.springframework.security.core.context.SecurityContextHolder
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.status

@WebMvcTest(PopularityEventController::class)
@AutoConfigureMockMvc(addFilters = false)
class PopularityEventControllerTest {

    @Autowired
    private lateinit var mvc: MockMvc

    @Autowired
    private lateinit var objectMapper: ObjectMapper

    @MockkBean
    private lateinit var useCase: PopularityEventUseCase

    @AfterEach
    fun tearDown() {
        SecurityContextHolder.clearContext()
    }

    @Test
    fun `POST popularity_events - records authenticated event`() {
        authenticate(42L)
        justRun { useCase.recordEvent(any()) }

        mvc.perform(
            post("/api/v1/popularity/events")
                .contentType(MediaType.APPLICATION_JSON)
                .content(
                    objectMapper.writeValueAsString(
                        mapOf(
                            "type" to "SEARCH_AUTOCOMPLETE_SELECTED",
                            "shopId" to 3,
                        ),
                    ),
                ),
        )
            .andExpect(status().isNoContent)

        verify { useCase.recordEvent(match { it.userId == 42L && it.shopId == 3L }) }
    }

    private fun authenticate(userId: Long) {
        val principal = SecurityPrincipal(userId = userId, role = "ROLE_USER")
        val auth = UsernamePasswordAuthenticationToken(principal, null, listOf(SimpleGrantedAuthority("ROLE_USER")))
        SecurityContextHolder.getContext().authentication = auth
    }
}
