package com.aniwhere.server.domain.auth.port.out

import java.time.LocalDateTime

data class AuthUserRecord(
    val id: Long,
    val userKey: Long,
    val status: String,
)

interface AuthPersistencePort {
    fun findUserByUserKey(userKey: Long): AuthUserRecord?
    fun createUser(userKey: Long): AuthUserRecord
    fun touchLastLogin(userId: Long, whenAt: LocalDateTime)
    fun isAdmin(userId: Long): Boolean
    fun saveRefreshToken(userId: Long, tokenHash: String, expiresAt: LocalDateTime)
    fun revokeRefreshToken(tokenHash: String): Boolean
    fun revokeAllRefreshTokens(userId: Long)
    fun existsActiveRefreshToken(tokenHash: String, now: LocalDateTime): Boolean
    fun markUserUnlinked(userKey: Long): Long?
    fun saveUnlinkEvent(userKey: Long, referrer: String, rawPayload: String?)
}
