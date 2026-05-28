package com.aniwhere.server.adapter.`in`.web

import com.aniwhere.server.common.dto.ApiResponse
import com.aniwhere.server.common.exception.UnauthorizedException
import com.aniwhere.server.config.security.SecurityPrincipal
import com.aniwhere.server.domain.user.model.UserAppRole
import com.aniwhere.server.domain.user.model.UserSummary
import com.aniwhere.server.domain.user.port.`in`.UserUseCase
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.tags.Tag
import jakarta.validation.Valid
import jakarta.validation.constraints.NotNull
import org.springframework.security.core.context.SecurityContextHolder
import org.springframework.web.bind.annotation.PatchMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@Tag(name = "User Admin", description = "회원 권한 관리자 API")
@RestController
@RequestMapping("/api/v1/admin/users")
class AdminUserController(
    private val userUseCase: UserUseCase,
) {
    @Operation(summary = "회원 권한 변경")
    @PatchMapping("/{userId}/role")
    fun updateUserRole(
        @PathVariable userId: Long,
        @Valid @RequestBody request: UpdateUserRoleRequest,
    ): ApiResponse<UserSummary> =
        ApiResponse.ok(userUseCase.updateUserRole(currentUserId(), userId, request.role))

    private fun currentUserId(): Long =
        (SecurityContextHolder.getContext().authentication?.principal as? SecurityPrincipal)?.userId
            ?: throw UnauthorizedException("Authentication required")
}

data class UpdateUserRoleRequest(
    @field:NotNull val role: UserAppRole,
)
