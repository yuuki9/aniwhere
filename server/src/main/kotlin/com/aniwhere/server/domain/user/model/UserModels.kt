package com.aniwhere.server.domain.user.model

import java.time.LocalDateTime

data class UserSummary(
    val id: Long,
    val userKey: Long,
    val nickname: String?,
    val status: String,
    val lastLoginAt: LocalDateTime?,
    val createdAt: LocalDateTime,
)

data class NicknameAvailabilityResult(
    val nickname: String,
    val available: Boolean,
)
