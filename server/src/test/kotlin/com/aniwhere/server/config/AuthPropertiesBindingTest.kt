package com.aniwhere.server.config

import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test
import org.springframework.boot.context.properties.EnableConfigurationProperties
import org.springframework.boot.test.context.runner.ApplicationContextRunner

class AuthPropertiesBindingTest {
    private val runner =
        ApplicationContextRunner()
            .withUserConfiguration(TestConfig::class.java)
            .withPropertyValues(
                "app.auth.jwt.issuer=aniwhere",
                "app.auth.jwt.access-exp-seconds=900",
                "app.auth.jwt.refresh-exp-seconds=1209600",
                "app.auth.jwt.secret=test-secret-test-secret-test-secret-1234",
                "app.auth.toss.base-url=https://apps-in-toss-api.toss.im",
            )

    @Test
    fun `auth properties bind 성공`() {
        runner.run { context ->
            val props = context.getBean(AuthProperties::class.java)
            assertThat(props.jwt.issuer).isEqualTo("aniwhere")
            assertThat(props.toss.baseUrl).contains("apps-in-toss-api")
        }
    }

    @EnableConfigurationProperties(AuthProperties::class)
    class TestConfig
}
