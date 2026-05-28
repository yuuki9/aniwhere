package com.aniwhere.server.domain.user.model

import java.time.LocalDateTime

enum class UserAppRole {
    ADMIN,
    USER,
    ;

    fun toSecurityRole(): String =
        when (this) {
            ADMIN -> "ROLE_ADMIN"
            USER -> "ROLE_USER"
        }

    companion object {
        fun fromSecurityRole(role: String): UserAppRole =
            when (role) {
                "ROLE_ADMIN" -> ADMIN
                else -> USER
            }
    }
}

data class UserSummary(
    val id: Long,
    val userKey: Long,
    val nickname: String?,
    val status: String,
    val role: String,
    val lastLoginAt: LocalDateTime?,
    val createdAt: LocalDateTime,
)

data class NicknameAvailabilityResult(
    val nickname: String,
    val available: Boolean,
)
