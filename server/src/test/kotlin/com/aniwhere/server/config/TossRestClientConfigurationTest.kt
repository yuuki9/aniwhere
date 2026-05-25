package com.aniwhere.server.config

import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test
import org.springframework.boot.context.properties.EnableConfigurationProperties
import org.springframework.boot.test.context.runner.ApplicationContextRunner
import org.springframework.web.client.RestClient

class TossRestClientConfigurationTest {
    private val runner =
        ApplicationContextRunner()
            .withUserConfiguration(TossRestClientConfiguration::class.java, TestConfig::class.java)
            .withPropertyValues(
                "app.auth.toss.mtls.enabled=false",
            )

    @Test
    fun `mTLS 비활성화면 기본 RestClient builder를 등록한다`() {
        runner.run { context ->
            val builder = context.getBean("tossRestClientBuilder", RestClient.Builder::class.java)
            assertThat(builder).isNotNull
        }
    }

    @EnableConfigurationProperties(AuthProperties::class)
    class TestConfig
}
