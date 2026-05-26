package com.aniwhere.server.config

import java.net.http.HttpClient
import java.time.Duration
import org.slf4j.LoggerFactory
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.http.client.JdkClientHttpRequestFactory
import org.springframework.web.client.RestClient

@Configuration
class TossRestClientConfiguration(
    private val props: AuthProperties,
) {
    private val log = LoggerFactory.getLogger(javaClass)

    @Bean(name = ["tossRestClientBuilder"])
    fun tossRestClientBuilder(): RestClient.Builder {
        val mtls = props.toss.mtls
        if (!mtls.enabled) {
            log.warn("Toss RestClient mTLS disabled; client certificate will not be sent")
            return RestClient.builder()
        }

        log.info(
            "Toss RestClient mTLS enabled certPath={} keyPath={} skipStartupCheck={}",
            mtls.certPath,
            mtls.keyPath,
            mtls.skipStartupCheck,
        )
        return mtlsRestClientBuilder(
            certPath = mtls.certPath,
            keyPath = mtls.keyPath,
        )
    }

    @Bean
    fun tossRestClientMtlsStatus(): TossRestClientMtlsStatus {
        val mtls = props.toss.mtls
        if (!mtls.enabled) {
            return TossRestClientMtlsStatus.disabled()
        }

        return runCatching {
            TossRestClientMtlsStatus(
                enabled = true,
                builderUsesMtlsHttpClient = true,
                configuredCertSubject = MtlsSslContextFactory.readConfiguredCertSubject(mtls.certPath),
            )
        }.getOrElse { error ->
            log.warn(
                "Toss RestClient mTLS status unavailable certPath={} reason={}",
                mtls.certPath,
                error.message,
            )
            TossRestClientMtlsStatus(
                enabled = true,
                builderUsesMtlsHttpClient = true,
                configuredCertSubject = null,
            )
        }
    }

    private fun mtlsRestClientBuilder(certPath: String, keyPath: String): RestClient.Builder {
        val sslContext = MtlsSslContextFactory.fromPem(certPath = certPath, keyPath = keyPath)
        val httpClient =
            HttpClient.newBuilder()
                .sslContext(sslContext)
                .connectTimeout(Duration.ofSeconds(10))
                .build()
        val requestFactory = JdkClientHttpRequestFactory(httpClient)
        log.info("Toss RestClient builder ready with mTLS HttpClient connectTimeoutSec=10")
        return RestClient.builder().requestFactory(requestFactory)
    }
}
