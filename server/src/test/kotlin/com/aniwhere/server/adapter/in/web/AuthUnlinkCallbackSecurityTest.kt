package com.aniwhere.server.adapter.`in`.web

import com.aniwhere.server.common.exception.GlobalExceptionHandler
import com.aniwhere.server.config.AuthProperties
import com.aniwhere.server.domain.auth.port.`in`.AuthUseCase
import com.ninjasquad.springmockk.MockkBean
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.context.properties.EnableConfigurationProperties
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest
import org.springframework.context.annotation.Import
import org.springframework.http.MediaType
import org.springframework.test.context.TestPropertySource
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.status

@WebMvcTest(AuthController::class)
@AutoConfigureMockMvc(addFilters = false)
@Import(GlobalExceptionHandler::class)
@EnableConfigurationProperties(AuthProperties::class)
@TestPropertySource(
    properties = [
        "app.auth.jwt.issuer=aniwhere",
        "app.auth.jwt.access-exp-seconds=900",
        "app.auth.jwt.refresh-exp-seconds=1209600",
        "app.auth.jwt.secret=test-secret-test-secret-test-secret-1234",
        "app.auth.toss.base-url=https://apps-in-toss-api.toss.im",
        "app.auth.toss.unlink-basic-auth=expected-credential",
    ],
)
class AuthUnlinkCallbackSecurityTest {
    @Autowired
    private lateinit var mvc: MockMvc

    @MockkBean
    private lateinit var authUseCase: AuthUseCase

    @Test
    fun `unlink callback basic auth 불일치 시 401`() {
        mvc.perform(
            post("/api/v1/auth/toss/unlink-callback")
                .contentType(MediaType.APPLICATION_JSON)
                .header("Authorization", "Basic invalid")
                .content("""{"userKey":443731104,"referrer":"UNLINK"}"""),
        ).andExpect(status().isUnauthorized)
    }
}
