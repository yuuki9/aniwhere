package com.aniwhere.server.domain.auth.service

import com.aniwhere.server.config.AuthProperties
import com.aniwhere.server.config.security.JwtTokenProvider
import com.aniwhere.server.domain.auth.port.out.AuthPersistencePort
import com.aniwhere.server.domain.auth.port.out.AuthUserRecord
import com.aniwhere.server.domain.auth.port.out.TossAuthPort
import io.mockk.every
import io.mockk.mockk
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test

class AuthServiceTest {
    private val persistence = mockk<AuthPersistencePort>(relaxed = true)
    private val toss = mockk<TossAuthPort>()
    private val provider =
        JwtTokenProvider(
            AuthProperties(
                jwt = AuthProperties.Jwt(secret = "test-secret-test-secret-test-secret-1234"),
                toss = AuthProperties.Toss(),
            ),
        )
    private val service = AuthService(persistence, toss, provider)

    @Test
    fun `로그인 성공 시 access refresh 발급`() {
        every { toss.exchangeAndGetUserKey("code", "DEFAULT") } returns 443731104L
        every { persistence.findUserByUserKey(443731104L) } returns null
        every { persistence.createUser(443731104L) } returns AuthUserRecord(1L, 443731104L, "ACTIVE")
        every { persistence.isAdmin(1L) } returns false

        val result = service.login("code", "DEFAULT")
        assertThat(result.role).isEqualTo("ROLE_USER")
        assertThat(result.accessToken).isNotBlank
        assertThat(result.refreshToken).isNotBlank
    }
}
