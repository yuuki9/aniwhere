package com.aniwhere.server.config.security

import com.aniwhere.server.adapter.`in`.web.AuthController
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
import org.springframework.test.context.TestPropertySource
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.status

/**
 * /api/v1/auth 아래 미등록 경로가 컨트롤러 슬라이스에서 정상 처리되는지 확인한다.
 * 실제 Security 필터 체인은 통합 테스트에서 검증하는 편이 안전하다.
 */
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
    ],
)
class SecurityConfigAuthTest {
    @Autowired
    private lateinit var mvc: MockMvc

    @MockkBean
    private lateinit var authUseCase: AuthUseCase

    @Test
    fun `auth 영역 미등록 경로는 404`() {
        mvc.perform(get("/api/v1/auth/health")).andExpect(status().isNotFound)
    }
}
