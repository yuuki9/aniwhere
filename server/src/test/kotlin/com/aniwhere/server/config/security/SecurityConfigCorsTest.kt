package com.aniwhere.server.config.security

import com.aniwhere.server.adapter.`in`.web.UserController
import com.aniwhere.server.common.config.CorsConfig
import com.aniwhere.server.common.exception.GlobalExceptionHandler
import com.aniwhere.server.config.AuthProperties
import com.aniwhere.server.domain.user.port.`in`.UserUseCase
import com.ninjasquad.springmockk.MockkBean
import org.hamcrest.Matchers.containsString
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.context.properties.EnableConfigurationProperties
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest
import org.springframework.context.annotation.Import
import org.springframework.test.context.TestPropertySource
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.options
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.header
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.status

@WebMvcTest(UserController::class)
@AutoConfigureMockMvc
@Import(SecurityConfig::class, CorsConfig::class, JwtTokenProvider::class, GlobalExceptionHandler::class)
@EnableConfigurationProperties(AuthProperties::class)
@TestPropertySource(
    properties = [
        "app.auth.jwt.issuer=aniwhere",
        "app.auth.jwt.access-exp-seconds=900",
        "app.auth.jwt.refresh-exp-seconds=1209600",
        "app.auth.jwt.secret=test-secret-test-secret-test-secret-1234",
        "app.auth.toss.base-url=https://apps-in-toss-api.toss.im",
    ],
)
class SecurityConfigCorsTest {
    @Autowired
    private lateinit var mvc: MockMvc

    @MockkBean
    private lateinit var userUseCase: UserUseCase

    @Test
    fun `OPTIONS users_me preflight allows authorization header`() {
        mvc.perform(
            options("/api/v1/users/me")
                .header("Origin", "https://example.com")
                .header("Access-Control-Request-Method", "GET")
                .header("Access-Control-Request-Headers", "authorization"),
        )
            .andExpect(status().isOk)
            .andExpect(header().string("Access-Control-Allow-Origin", "https://example.com"))
            .andExpect(header().string("Access-Control-Allow-Methods", containsString("GET")))
            .andExpect(header().string("Access-Control-Allow-Headers", containsString("authorization")))
    }
}
