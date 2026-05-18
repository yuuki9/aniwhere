package com.aniwhere.server.domain.auth.service

import com.aniwhere.server.common.exception.UnauthorizedException
import com.aniwhere.server.config.security.JwtTokenProvider
import com.aniwhere.server.domain.auth.model.LoginResult
import com.aniwhere.server.domain.auth.model.RefreshResult
import com.aniwhere.server.domain.auth.port.`in`.AuthUseCase
import com.aniwhere.server.domain.auth.port.out.AuthPersistencePort
import com.aniwhere.server.domain.auth.port.out.TossAuthPort
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.Instant
import java.time.LocalDateTime
import java.time.ZoneId

@Service
class AuthService(
    private val persistence: AuthPersistencePort,
    private val toss: TossAuthPort,
    private val jwt: JwtTokenProvider,
) : AuthUseCase {
    @Transactional
    override fun login(authorizationCode: String, referrer: String): LoginResult {
        val userKey = toss.exchangeAndGetUserKey(authorizationCode, referrer)
        val existing = persistence.findUserByUserKey(userKey)
        val isNewUser = existing == null
        val user = existing ?: persistence.createUser(userKey)
        persistence.touchLastLogin(user.id, LocalDateTime.now())
        val role = if (persistence.isAdmin(user.id)) "ROLE_ADMIN" else "ROLE_USER"
        val access = jwt.createAccessToken(user.id, role)
        val refresh = jwt.createRefreshToken(user.id)
        val refreshExp = jwt.parseExpiryEpochSeconds(refresh)
        val refreshExpAt = LocalDateTime.ofInstant(Instant.ofEpochSecond(refreshExp), ZoneId.systemDefault())
        persistence.saveRefreshToken(user.id, jwt.hashRefreshToken(refresh), refreshExpAt)
        return LoginResult(access, refresh, jwt.parseExpiryEpochSeconds(access), role, isNewUser)
    }

    @Transactional
    override fun refresh(refreshToken: String): RefreshResult {
        val tokenHash = jwt.hashRefreshToken(refreshToken)
        val active = persistence.existsActiveRefreshToken(tokenHash, LocalDateTime.now())
        if (!active) throw UnauthorizedException("Invalid refresh token")
        val userId = jwt.parseUserId(refreshToken)
        val role = if (persistence.isAdmin(userId)) "ROLE_ADMIN" else "ROLE_USER"
        val newAccess = jwt.createAccessToken(userId, role)
        val newRefresh = jwt.createRefreshToken(userId)
        persistence.revokeRefreshToken(tokenHash)
        val refreshExp = jwt.parseExpiryEpochSeconds(newRefresh)
        val refreshExpAt = LocalDateTime.ofInstant(Instant.ofEpochSecond(refreshExp), ZoneId.systemDefault())
        persistence.saveRefreshToken(userId, jwt.hashRefreshToken(newRefresh), refreshExpAt)
        return RefreshResult(newAccess, newRefresh, jwt.parseExpiryEpochSeconds(newAccess))
    }

    override fun logout(refreshToken: String) {
        persistence.revokeRefreshToken(jwt.hashRefreshToken(refreshToken))
    }

    @Transactional
    override fun handleUnlink(userKey: Long, referrer: String, rawPayload: String?) {
        persistence.saveUnlinkEvent(userKey, referrer, rawPayload)
        val userId = persistence.markUserUnlinked(userKey) ?: return
        persistence.revokeAllRefreshTokens(userId)
    }
}
