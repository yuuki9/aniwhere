package com.aniwhere.server.adapter.`in`.web

import com.aniwhere.server.common.dto.ApiResponse
import com.aniwhere.server.common.exception.UnauthorizedException
import com.aniwhere.server.config.AuthProperties
import com.aniwhere.server.domain.auth.model.LoginResult
import com.aniwhere.server.domain.auth.port.`in`.AuthUseCase
import com.fasterxml.jackson.databind.ObjectMapper
import jakarta.validation.Valid
import jakarta.validation.constraints.NotBlank
import org.slf4j.LoggerFactory
import org.springframework.http.HttpStatus
import org.springframework.validation.annotation.Validated
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestHeader
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.ResponseStatus
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/api/v1/auth")
@Validated
class AuthController(
    private val authUseCase: AuthUseCase,
    private val authProperties: AuthProperties,
    private val objectMapper: ObjectMapper,
) {
    private val log = LoggerFactory.getLogger(javaClass)

    @PostMapping("/toss/login")
    fun tossLogin(
        @Valid @RequestBody request: TossLoginRequest,
    ): ApiResponse<LoginResult> {
        log.info(
            "Toss login request received body={}",
            objectMapper.writeValueAsString(
                mapOf(
                    "authorizationCode" to request.authorizationCode,
                    "referrer" to request.referrer,
                ),
            ),
        )
        return ApiResponse.ok(authUseCase.login(request.authorizationCode, request.referrer))
    }

    @PostMapping("/refresh")
    fun refresh(
        @Valid @RequestBody request: RefreshRequest,
    ) = ApiResponse.ok(authUseCase.refresh(request.refreshToken))

    @PostMapping("/logout")
    @ResponseStatus(HttpStatus.OK)
    fun logout(
        @Valid @RequestBody request: RefreshRequest,
    ): ApiResponse<Unit> {
        authUseCase.logout(request.refreshToken)
        return ApiResponse.ok()
    }

    @PostMapping("/toss/unlink-callback")
    @ResponseStatus(HttpStatus.OK)
    fun unlinkCallback(
        @RequestHeader(name = "Authorization", required = false) authorization: String?,
        @RequestBody request: UnlinkRequest,
    ): ApiResponse<Unit> {
        val expected = "Basic ${authProperties.toss.unlinkBasicAuth}"
        if (authorization == null || authorization != expected) {
            throw UnauthorizedException("Invalid unlink callback authorization")
        }
        authUseCase.handleUnlink(request.userKey, request.referrer, request.rawPayload)
        return ApiResponse.ok()
    }
}

data class TossLoginRequest(
    @field:NotBlank val authorizationCode: String,
    @field:NotBlank val referrer: String,
)

data class RefreshRequest(
    @field:NotBlank val refreshToken: String,
)

data class UnlinkRequest(
    val userKey: Long,
    val referrer: String,
    val rawPayload: String? = null,
)
