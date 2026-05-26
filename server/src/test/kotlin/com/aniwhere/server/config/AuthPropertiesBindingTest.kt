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
                "app.auth.toss.mtls.cert-path=/home/ubuntu/mtls/aniwhere_public.crt",
                "app.auth.toss.mtls.key-path=/home/ubuntu/mtls/aniwhere_private.key",
                "app.auth.toss.mtls.enabled=true",
            )

    @Test
    fun `auth properties bind 성공`() {
        runner.run { context ->
            val props = context.getBean(AuthProperties::class.java)
            assertThat(props.jwt.issuer).isEqualTo("aniwhere")
            assertThat(props.toss.baseUrl).contains("apps-in-toss-api")
            assertThat(props.toss.mtls.certPath).endsWith("aniwhere_public.crt")
            assertThat(props.toss.mtls.keyPath).endsWith("aniwhere_private.key")
            assertThat(props.toss.mtls.enabled).isTrue()
        }
    }

    @EnableConfigurationProperties(AuthProperties::class)
    class TestConfig
}
