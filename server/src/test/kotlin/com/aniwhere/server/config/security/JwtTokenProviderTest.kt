package com.aniwhere.server.config.security

import com.aniwhere.server.config.AuthProperties
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test

class JwtTokenProviderTest {
    private val props =
        AuthProperties(
            jwt =
                AuthProperties.Jwt(
                    issuer = "aniwhere",
                    accessExpSeconds = 900,
                    refreshExpSeconds = 1209600,
                    secret = "test-secret-test-secret-test-secret-1234",
                ),
            toss = AuthProperties.Toss(),
        )
    private val jwt = JwtTokenProvider(props)

    @Test
    fun `access 토큰에서 subject와 role을 읽는다`() {
        val token = jwt.createAccessToken(42L, "ROLE_ADMIN")
        assertThat(jwt.parseUserId(token)).isEqualTo(42L)
        assertThat(jwt.parseRole(token)).isEqualTo("ROLE_ADMIN")
    }

    @Test
    fun `refresh 해시는 결정적이다`() {
        val h1 = jwt.hashRefreshToken("same")
        val h2 = jwt.hashRefreshToken("same")
        assertThat(h1).isEqualTo(h2)
    }
}
