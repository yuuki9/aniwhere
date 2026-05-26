package com.aniwhere.server.adapter.out.toss

import com.fasterxml.jackson.databind.DeserializationFeature
import com.fasterxml.jackson.databind.JsonNode
import com.fasterxml.jackson.databind.ObjectMapper
import com.fasterxml.jackson.databind.node.ObjectNode
import com.fasterxml.jackson.module.kotlin.jacksonObjectMapper
import com.aniwhere.server.common.exception.BadRequestException
import com.aniwhere.server.config.AuthProperties
import com.aniwhere.server.domain.auth.port.out.TossAuthPort
import java.security.MessageDigest
import java.util.UUID
import org.slf4j.LoggerFactory
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
    private val log = LoggerFactory.getLogger(javaClass)

    private val objectMapper: ObjectMapper =
        jacksonObjectMapper().configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false)

    override fun exchangeAndGetUserKey(authorizationCode: String, referrer: String): Long {
        val requestId = newRequestId()
        val exchangeStartedAtNs = System.nanoTime()
        val rest = restClientBuilder.baseUrl(props.toss.baseUrl).build()
        val normalizedReferrer = normalizeReferrer(referrer)
        val authorizationCodeFingerprint = fingerprintAuthorizationCode(authorizationCode)

        log.info(
            "Toss auth exchange started requestId={} baseUrl={} referrerIn={} referrerOut={} authorizationCodeFp={}",
            requestId,
            props.toss.baseUrl,
            referrer,
            normalizedReferrer,
            authorizationCodeFingerprint,
        )

        val generateTokenStartedAtNs = System.nanoTime()
        val tokenResponseRaw =
            try {
                rest.post()
                    .uri("/api-partner/v1/apps-in-toss/user/oauth2/generate-token")
                    .contentType(MediaType.APPLICATION_JSON)
                    .accept(MediaType.APPLICATION_JSON)
                    .body(mapOf("authorizationCode" to authorizationCode, "referrer" to normalizedReferrer))
                    .retrieve()
                    .body(String::class.java)
            } catch (e: RestClientResponseException) {
                log.warn(
                    "Toss generate-token HTTP error requestId={} authorizationCodeFp={} status={} body={}",
                    requestId,
                    authorizationCodeFingerprint,
                    e.statusCode.value(),
                    maskSensitiveJson(e.responseBodyAsString),
                    e,
                )
                throw BadRequestException(
                    "토스 토큰 발급 HTTP 오류(status=${e.statusCode.value()}, ${describeTossGenerateTokenResponse(e.responseBodyAsString)})",
                )
            }

        log.info(
            "Toss generate-token response requestId={} authorizationCodeFp={} elapsedMs={} diagnosis={}",
            requestId,
            authorizationCodeFingerprint,
            elapsedMs(generateTokenStartedAtNs),
            describeTossGenerateTokenResponse(tokenResponseRaw),
        )

        if (tokenResponseRaw.isNullOrBlank()) {
            log.warn(
                "Toss generate-token response body is empty requestId={} authorizationCodeFp={}",
                requestId,
                authorizationCodeFingerprint,
            )
            throw BadRequestException("토스 토큰 발급 응답이 비어 있습니다.")
        }

        val tokenResponse =
            runCatching {
                objectMapper.readValue(tokenResponseRaw, GenerateTokenResponse::class.java)
            }.getOrElse { e ->
                log.warn(
                    "Toss generate-token response parse failed requestId={} authorizationCodeFp={} body={}",
                    requestId,
                    authorizationCodeFingerprint,
                    maskSensitiveJson(tokenResponseRaw),
                    e,
                )
                throw BadRequestException("토스 토큰 발급 응답 파싱에 실패했습니다.")
            }

        val accessToken = tokenResponse.success?.accessToken
        if (accessToken.isNullOrBlank()) {
            val diagnosis = describeTossGenerateTokenResponse(tokenResponseRaw)
            log.warn(
                "Toss generate-token missing accessToken requestId={} authorizationCodeFp={} diagnosis={} body={}",
                requestId,
                authorizationCodeFingerprint,
                diagnosis,
                maskSensitiveJson(tokenResponseRaw),
            )
            throw BadRequestException("토스 accessToken 응답이 비어 있습니다. ($diagnosis)")
        }

        log.debug(
            "Toss generate-token succeeded resultType={} accessToken={}",
            tokenResponse.resultType ?: "(missing)",
            maskSecret(accessToken),
        )

        val loginMeStartedAtNs = System.nanoTime()
        val me =
            try {
                rest.get()
                    .uri("/api-partner/v1/apps-in-toss/user/oauth2/login-me")
                    .header("Authorization", "Bearer $accessToken")
                    .retrieve()
                    .body(LoginMeResponse::class.java)
            } catch (e: RestClientResponseException) {
                log.warn(
                    "Toss login-me HTTP error requestId={} authorizationCodeFp={} status={} body={}",
                    requestId,
                    authorizationCodeFingerprint,
                    e.statusCode.value(),
                    maskSensitiveJson(e.responseBodyAsString),
                    e,
                )
                throw BadRequestException("토스 사용자 조회 HTTP 오류(status=${e.statusCode.value()})")
            } ?: run {
                log.warn(
                    "Toss login-me response body is empty requestId={} authorizationCodeFp={}",
                    requestId,
                    authorizationCodeFingerprint,
                )
                throw BadRequestException("토스 사용자 조회에 실패했습니다.")
            }

        log.info(
            "Toss login-me response received requestId={} authorizationCodeFp={} elapsedMs={} resultType={}",
            requestId,
            authorizationCodeFingerprint,
            elapsedMs(loginMeStartedAtNs),
            me.resultType ?: "(missing)",
        )

        val userKey = me.success?.userKey
        if (userKey == null) {
            log.warn(
                "Toss login-me missing userKey requestId={} authorizationCodeFp={} resultType={}",
                requestId,
                authorizationCodeFingerprint,
                me.resultType ?: "(missing)",
            )
            throw BadRequestException("토스 userKey 응답이 비어 있습니다.")
        }

        log.info(
            "Toss auth exchange completed requestId={} authorizationCodeFp={} userKey={} totalElapsedMs={}",
            requestId,
            authorizationCodeFingerprint,
            userKey,
            elapsedMs(exchangeStartedAtNs),
        )

        return userKey
    }

    private fun normalizeReferrer(referrer: String): String =
        if (referrer.equals("SANDBOX", ignoreCase = true)) "sandbox" else referrer

    private fun newRequestId(): String = UUID.randomUUID().toString().substring(0, 8)

    private fun elapsedMs(startNs: Long): Long = (System.nanoTime() - startNs) / 1_000_000

    private fun fingerprintAuthorizationCode(value: String): String {
        val digest = MessageDigest.getInstance("SHA-256").digest(value.toByteArray())
        val hashPrefix = digest.joinToString("") { "%02x".format(it) }.take(12)
        return "$hashPrefix(len=${value.length})"
    }

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

    private fun maskSensitiveJson(raw: String?): String {
        if (raw.isNullOrBlank()) return "(empty)"

        return runCatching {
            val node = objectMapper.readTree(raw)
            maskJsonSecrets(node)
            objectMapper.writeValueAsString(node)
        }.getOrElse { maskSecret(raw) }
    }

    private fun maskJsonSecrets(node: JsonNode) {
        when {
            node.isObject -> {
                val objectNode = node as ObjectNode
                objectNode.fields().forEachRemaining { (fieldName, value) ->
                    if (isSensitiveField(fieldName)) {
                        if (value.isTextual) {
                            objectNode.put(fieldName, maskSecret(value.asText()))
                        }
                    } else {
                        maskJsonSecrets(value)
                    }
                }
            }
            node.isArray -> node.forEach(::maskJsonSecrets)
        }
    }

    private fun isSensitiveField(fieldName: String): Boolean {
        val normalized = fieldName.lowercase()
        return normalized.contains("token") ||
            normalized.contains("authorizationcode") ||
            normalized == "code"
    }

    private fun maskSecret(value: String): String {
        val trimmed = value.trim()
        if (trimmed.length <= 8) return "***"
        return "${trimmed.take(4)}...${trimmed.takeLast(4)}(len=${trimmed.length})"
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
