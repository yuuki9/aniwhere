package com.aniwhere.server.adapter.`in`.web

import com.aniwhere.server.config.AuthProperties
import com.aniwhere.server.domain.auth.model.LoginResult
import com.aniwhere.server.domain.auth.model.RefreshResult
import com.aniwhere.server.domain.auth.port.`in`.AuthUseCase
import com.ninjasquad.springmockk.MockkBean
import io.mockk.every
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest
import org.springframework.http.MediaType
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.status

@WebMvcTest(AuthController::class)
@AutoConfigureMockMvc(addFilters = false)
class AuthControllerTest {
    @Autowired
    private lateinit var mvc: MockMvc

    @MockkBean
    private lateinit var authUseCase: AuthUseCase

    @MockkBean
    private lateinit var authProperties: AuthProperties

    @Test
    fun `login API returns tokens`() {
        every { authUseCase.login("code-1", "DEFAULT") } returns LoginResult("acc", "ref", 900, "ROLE_USER", true)
        mvc.perform(
            post("/api/v1/auth/toss/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""{"authorizationCode":"code-1","referrer":"DEFAULT"}"""),
        ).andExpect(status().isOk)
            .andExpect(jsonPath("$.data.accessToken").value("acc"))
    }

    @Test
    fun `refresh API rotates token`() {
        every { authUseCase.refresh("old-ref") } returns RefreshResult("new-acc", "new-ref", 900)
        mvc.perform(
            post("/api/v1/auth/refresh")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""{"refreshToken":"old-ref"}"""),
        ).andExpect(status().isOk)
            .andExpect(jsonPath("$.data.refreshToken").value("new-ref"))
    }
}
