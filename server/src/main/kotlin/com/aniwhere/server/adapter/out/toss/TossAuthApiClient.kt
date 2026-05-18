package com.aniwhere.server.adapter.out.toss

import com.aniwhere.server.common.exception.BadRequestException
import com.aniwhere.server.config.AuthProperties
import com.aniwhere.server.domain.auth.port.out.TossAuthPort
import org.springframework.http.MediaType
import org.springframework.stereotype.Component
import org.springframework.web.client.RestClient

@Component
class TossAuthApiClient(
    private val restClientBuilder: RestClient.Builder,
    private val props: AuthProperties,
) : TossAuthPort {
    override fun exchangeAndGetUserKey(authorizationCode: String, referrer: String): Long {
        val rest = restClientBuilder.baseUrl(props.toss.baseUrl).build()

        val tokenResponse =
            rest.post()
                .uri("/api-partner/v1/apps-in-toss/user/oauth2/generate-token")
                .contentType(MediaType.APPLICATION_JSON)
                .body(mapOf("authorizationCode" to authorizationCode, "referrer" to referrer))
                .retrieve()
                .body(GenerateTokenResponse::class.java)
                ?: throw BadRequestException("토스 토큰 발급에 실패했습니다.")

        val accessToken = tokenResponse.success?.accessToken
            ?: throw BadRequestException("토스 accessToken 응답이 비어 있습니다.")

        val me =
            rest.get()
                .uri("/api-partner/v1/apps-in-toss/user/oauth2/login-me")
                .header("Authorization", "Bearer $accessToken")
                .retrieve()
                .body(LoginMeResponse::class.java)
                ?: throw BadRequestException("토스 사용자 조회에 실패했습니다.")

        return me.success?.userKey ?: throw BadRequestException("토스 userKey 응답이 비어 있습니다.")
    }

    data class GenerateTokenResponse(val success: GenerateTokenSuccess?)

    data class GenerateTokenSuccess(val accessToken: String?)

    data class LoginMeResponse(val success: LoginMeSuccess?)

    data class LoginMeSuccess(val userKey: Long?)
}
