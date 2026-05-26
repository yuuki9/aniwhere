package com.aniwhere.server.adapter.out.toss

import com.aniwhere.server.common.exception.BadRequestException
import com.aniwhere.server.config.AuthProperties
import org.assertj.core.api.Assertions.assertThat
import org.assertj.core.api.Assertions.assertThatThrownBy
import org.junit.jupiter.api.Test
import org.springframework.web.client.RestClient
import com.sun.net.httpserver.HttpServer
import java.net.InetSocketAddress

class TossAuthApiClientTest {
    @Test
    fun `generate-token이 octet-stream 이어도 userKey를 반환한다`() {
        val server = HttpServer.create(InetSocketAddress(0), 0)
        var generateTokenRequestBody: String? = null

        server.createContext("/api-partner/v1/apps-in-toss/user/oauth2/generate-token") { exchange ->
            generateTokenRequestBody = exchange.requestBody.bufferedReader().use { it.readText() }
            val responseBody = """{"resultType":"SUCCESS","success":{"accessToken":"access-token-1"}}"""
            exchange.responseHeaders.add("Content-Type", "application/octet-stream")
            exchange.sendResponseHeaders(200, responseBody.toByteArray().size.toLong())
            exchange.responseBody.use { it.write(responseBody.toByteArray()) }
        }
        server.createContext("/api-partner/v1/apps-in-toss/user/oauth2/login-me") { exchange ->
            val responseBody = """{"resultType":"SUCCESS","success":{"userKey":443731104}}"""
            exchange.responseHeaders.add("Content-Type", "application/json")
            exchange.sendResponseHeaders(200, responseBody.toByteArray().size.toLong())
            exchange.responseBody.use { it.write(responseBody.toByteArray()) }
        }
        server.start()

        val baseUrl = "http://127.0.0.1:${server.address.port}"
        val client =
            TossAuthApiClient(
                RestClient.builder().baseUrl(baseUrl),
                AuthProperties(toss = AuthProperties.Toss(baseUrl = baseUrl)),
            )

        try {
            val userKey = client.exchangeAndGetUserKey("code-1", "SANDBOX")

            assertThat(userKey).isEqualTo(443731104)
            assertThat(generateTokenRequestBody).contains("\"referrer\":\"sandbox\"")
        } finally {
            server.stop(0)
        }
    }

    @Test
    fun `generate-token 실패 응답에 토스 error 정보를 포함한다`() {
        val server = HttpServer.create(InetSocketAddress(0), 0)

        server.createContext("/api-partner/v1/apps-in-toss/user/oauth2/generate-token") { exchange ->
            val responseBody = """{"error":"invalid_grant"}"""
            exchange.responseHeaders.add("Content-Type", "application/json")
            exchange.sendResponseHeaders(200, responseBody.toByteArray().size.toLong())
            exchange.responseBody.use { it.write(responseBody.toByteArray()) }
        }
        server.start()

        val baseUrl = "http://127.0.0.1:${server.address.port}"
        val client =
            TossAuthApiClient(
                RestClient.builder().baseUrl(baseUrl),
                AuthProperties(toss = AuthProperties.Toss(baseUrl = baseUrl)),
            )

        try {
            assertThatThrownBy { client.exchangeAndGetUserKey("expired-code", "sandbox") }
                .isInstanceOf(BadRequestException::class.java)
                .hasMessageContaining("invalid_grant")
                .hasMessageContaining("hasAccessToken=false")
        } finally {
            server.stop(0)
        }
    }
}
