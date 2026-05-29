package com.aniwhere.server.adapter.`in`.web

import com.aniwhere.server.common.dto.ApiResponse
import com.aniwhere.server.common.exception.UnauthorizedException
import com.aniwhere.server.common.logging.LogMasking
import com.aniwhere.server.config.security.SecurityPrincipal
import com.aniwhere.server.domain.user.model.UserSummary
import com.aniwhere.server.domain.user.port.`in`.UserUseCase
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.tags.Tag
import jakarta.servlet.http.HttpServletRequest
import jakarta.validation.Valid
import jakarta.validation.constraints.NotBlank
import org.slf4j.LoggerFactory
import org.springdoc.core.annotations.ParameterObject
import org.springframework.data.domain.Pageable
import org.springframework.data.web.PageableDefault
import org.springframework.security.core.context.SecurityContextHolder
import org.springframework.validation.annotation.Validated
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PatchMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController

@Tag(name = "User", description = "사용자 프로필/관리 API")
@RestController
@RequestMapping("/api/v1/users")
@Validated
class UserController(
    private val userUseCase: UserUseCase,
) {
    private val log = LoggerFactory.getLogger(javaClass)

    @Operation(summary = "내 회원 상세 조회")
    @GetMapping("/me")
    fun getMyProfile(request: HttpServletRequest): ApiResponse<UserSummary> {
        val authorizationHeader = request.getHeader("Authorization")
        val hasBearerHeader = authorizationHeader?.startsWith("Bearer ") == true
        val userId = currentUserIdOrNull()
        if (userId == null) {
            log.warn(
                "GET /users/me request unauthenticated hasBearerHeader={} authorization={}",
                hasBearerHeader,
                summarizeAuthorizationHeader(authorizationHeader),
            )
            throw UnauthorizedException("Authentication required")
        }

        log.info(
            "GET /users/me request authenticated userId={} hasBearerHeader={} authorization={}",
            userId,
            hasBearerHeader,
            summarizeAuthorizationHeader(authorizationHeader),
        )

        val profile = userUseCase.getMyProfile(userId)
        log.info(
            "GET /users/me response sent userId={} userKey={} hasNickname={} status={}",
            profile.id,
            profile.userKey,
            !profile.nickname.isNullOrBlank(),
            profile.status,
        )
        return ApiResponse.ok(profile)
    }

    @Operation(summary = "회원 목록 조회 (관리자)")
    @GetMapping
    fun listUsers(@ParameterObject @PageableDefault(size = 20) pageable: Pageable) =
        ApiResponse.ok(userUseCase.listUsers(pageable))

    @Operation(summary = "회원 상세 조회 (관리자)")
    @GetMapping("/{id}")
    fun getUserDetail(@PathVariable id: Long) = ApiResponse.ok(userUseCase.getUserDetail(id))

    @Operation(summary = "닉네임 중복 확인")
    @GetMapping("/nickname/availability")
    fun checkNicknameAvailability(
        @RequestParam @NotBlank nickname: String,
    ) = ApiResponse.ok(userUseCase.checkNicknameAvailability(currentUserIdOrNull(), nickname))

    @Operation(summary = "내 닉네임 수정")
    @PatchMapping("/me/nickname")
    fun updateNickname(
        @Valid @RequestBody request: UpdateNicknameRequest,
    ) = ApiResponse.ok(userUseCase.updateNickname(currentUserId(), request.nickname, request.emojiIconFilename))

    private fun currentUserIdOrNull(): Long? =
        (SecurityContextHolder.getContext().authentication?.principal as? SecurityPrincipal)?.userId

    private fun currentUserId(): Long =
        currentUserIdOrNull() ?: throw UnauthorizedException("Authentication required")

    private fun summarizeAuthorizationHeader(authorizationHeader: String?): String {
        if (authorizationHeader.isNullOrBlank()) {
            return "(missing)"
        }
        if (!authorizationHeader.startsWith("Bearer ")) {
            return "(non-bearer)"
        }
        return "Bearer ${LogMasking.maskSecret(authorizationHeader.removePrefix("Bearer ").trim())}"
    }
}

data class UpdateNicknameRequest(
    @field:NotBlank val nickname: String,
    val emojiIconFilename: String? = null,
)
