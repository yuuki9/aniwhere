package com.aniwhere.server.adapter.out.toss

import com.fasterxml.jackson.databind.DeserializationFeature
import com.fasterxml.jackson.databind.JsonNode
import com.fasterxml.jackson.databind.ObjectMapper
import com.fasterxml.jackson.module.kotlin.jacksonObjectMapper
import com.aniwhere.server.common.exception.BadRequestException
import com.aniwhere.server.config.AuthProperties
import com.aniwhere.server.domain.auth.port.out.TossAuthPort
import org.springframework.beans.factory.annotation.Qualifier
import org.springframework.http.MediaType
import org.springframework.stereotype.Component
import org.springframework.web.client.RestClient
import org.springframework.web.client.RestClientResponseException

@Component
class TossAuthApiClient(
    @Qualifier("tossRestClientBuilder") private val restClientBuilder: RestClient.Builder,
    private val props: AuthProperties,
) : TossAuthPort {
    private val objectMapper: ObjectMapper =
        jacksonObjectMapper().configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false)

    override fun exchangeAndGetUserKey(authorizationCode: String, referrer: String): Long {
        val rest = restClientBuilder.baseUrl(props.toss.baseUrl).build()
        val normalizedReferrer = normalizeReferrer(referrer)

        val generateTokenPath = "/api-partner/v1/apps-in-toss/user/oauth2/generate-token"
        val generateTokenBody =
            mapOf("authorizationCode" to authorizationCode, "referrer" to normalizedReferrer)

        val tokenResponseRaw =
            try {
                rest.post()
                    .uri(generateTokenPath)
                    .contentType(MediaType.APPLICATION_JSON)
                    .accept(MediaType.APPLICATION_JSON)
                    .body(generateTokenBody)
                    .retrieve()
                    .body(String::class.java)
            } catch (e: RestClientResponseException) {
                throw BadRequestException(
                    "토스 토큰 발급 HTTP 오류(status=${e.statusCode.value()}, ${describeTossGenerateTokenResponse(e.responseBodyAsString)})",
                )
            }

        if (tokenResponseRaw.isNullOrBlank()) {
            throw BadRequestException("토스 토큰 발급 응답이 비어 있습니다.")
        }

        val tokenResponse =
            runCatching {
                objectMapper.readValue(tokenResponseRaw, GenerateTokenResponse::class.java)
            }.getOrElse {
                throw BadRequestException("토스 토큰 발급 응답 파싱에 실패했습니다.")
            }

        val accessToken = tokenResponse.success?.accessToken
        if (accessToken.isNullOrBlank()) {
            val diagnosis = describeTossGenerateTokenResponse(tokenResponseRaw)
            throw BadRequestException("토스 accessToken 응답이 비어 있습니다. ($diagnosis)")
        }

        val loginMePath = "/api-partner/v1/apps-in-toss/user/oauth2/login-me"
        val me =
            try {
                rest.get()
                    .uri(loginMePath)
                    .header("Authorization", "Bearer $accessToken")
                    .retrieve()
                    .body(LoginMeResponse::class.java)
            } catch (e: RestClientResponseException) {
                throw BadRequestException("토스 사용자 조회 HTTP 오류(status=${e.statusCode.value()})")
            } ?: throw BadRequestException("토스 사용자 조회에 실패했습니다.")

        val userKey = me.success?.userKey
            ?: throw BadRequestException("토스 userKey 응답이 비어 있습니다.")

        return userKey
    }

    private fun normalizeReferrer(referrer: String): String =
        if (referrer.equals("SANDBOX", ignoreCase = true)) "sandbox" else referrer

    private fun describeTossGenerateTokenResponse(raw: String?): String {
        if (raw.isNullOrBlank()) return "emptyBody=true"

        return runCatching {
            val node = objectMapper.readTree(raw)
            val resultType = node.path("resultType").takeIf { !it.isMissingNode && !it.isNull }?.asText()
            val errorSummary = summarizeTossError(node.path("error"))
            val hasAccessToken = node.path("success").path("accessToken").takeIf { it.isTextual }?.asText()?.isNotBlank() == true

            buildString {
                append("resultType=").append(resultType ?: "(missing)")
                append(", hasAccessToken=").append(hasAccessToken)
                if (errorSummary != null) append(", error=").append(errorSummary)
            }
        }.getOrElse { "unparseableBody(length=${raw.length})" }
    }

    private fun summarizeTossError(errorNode: JsonNode): String? {
        if (errorNode.isMissingNode || errorNode.isNull) return null
        if (errorNode.isTextual) return errorNode.asText()
        if (errorNode.isObject) {
            val errorCode = errorNode.path("errorCode").takeIf { it.isTextual }?.asText()
            val reason = errorNode.path("reason").takeIf { it.isTextual }?.asText()
            return when {
                errorCode != null && reason != null -> "$errorCode: $reason"
                errorCode != null -> errorCode
                reason != null -> reason
                else -> errorNode.toString()
            }
        }
        return errorNode.toString()
    }

    data class GenerateTokenResponse(
        val resultType: String? = null,
        val success: GenerateTokenSuccess? = null,
    )

    data class GenerateTokenSuccess(val accessToken: String?)

    data class LoginMeResponse(
        val resultType: String? = null,
        val success: LoginMeSuccess? = null,
    )

    data class LoginMeSuccess(val userKey: Long?)
}
