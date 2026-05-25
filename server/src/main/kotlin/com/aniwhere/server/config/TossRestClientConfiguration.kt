package com.aniwhere.server.config

import java.net.http.HttpClient
import java.time.Duration
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.http.client.JdkClientHttpRequestFactory
import org.springframework.web.client.RestClient

@Configuration
class TossRestClientConfiguration(
    private val props: AuthProperties,
) {
    @Bean(name = ["tossRestClientBuilder"])
    fun tossRestClientBuilder(): RestClient.Builder {
        if (!props.toss.mtls.enabled) {
            return RestClient.builder()
        }
        return mtlsRestClientBuilder(
            certPath = props.toss.mtls.certPath,
            keyPath = props.toss.mtls.keyPath,
        )
    }

    private fun mtlsRestClientBuilder(certPath: String, keyPath: String): RestClient.Builder {
        val sslContext = MtlsSslContextFactory.fromPem(certPath = certPath, keyPath = keyPath)
        val httpClient =
            HttpClient.newBuilder()
                .sslContext(sslContext)
                .connectTimeout(Duration.ofSeconds(10))
                .build()
        val requestFactory = JdkClientHttpRequestFactory(httpClient)
        return RestClient.builder().requestFactory(requestFactory)
    }
}
