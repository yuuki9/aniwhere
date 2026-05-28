package com.aniwhere.server.adapter.out.persistence

import com.aniwhere.server.adapter.out.persistence.entity.RefreshTokenEntity
import com.aniwhere.server.adapter.out.persistence.entity.TossUnlinkEventEntity
import com.aniwhere.server.adapter.out.persistence.entity.UserEntity
import com.aniwhere.server.adapter.out.persistence.entity.AdminEntity
import com.aniwhere.server.adapter.out.persistence.repository.AdminRepository
import com.aniwhere.server.adapter.out.persistence.repository.RefreshTokenRepository
import com.aniwhere.server.adapter.out.persistence.repository.TossUnlinkEventRepository
import com.aniwhere.server.adapter.out.persistence.repository.UserRepository
import com.aniwhere.server.domain.auth.port.out.AuthPersistencePort
import com.aniwhere.server.domain.auth.port.out.AuthUserRecord
import org.springframework.stereotype.Component
import org.springframework.transaction.annotation.Transactional
import java.time.LocalDateTime
import com.aniwhere.server.common.exception.EntityNotFoundException

@Component
class AuthPersistenceAdapter(
    private val userRepo: UserRepository,
    private val adminRepo: AdminRepository,
    private val refreshRepo: RefreshTokenRepository,
    private val unlinkRepo: TossUnlinkEventRepository,
) : AuthPersistencePort {
    override fun findUserByUserKey(userKey: Long): AuthUserRecord? =
        userRepo.findByUserKey(userKey)?.let { AuthUserRecord(it.id!!, it.userKey, it.status) }

    override fun createUser(userKey: Long): AuthUserRecord {
        val saved = userRepo.save(UserEntity(userKey = userKey))
        return AuthUserRecord(saved.id!!, saved.userKey, saved.status)
    }

    override fun touchLastLogin(userId: Long, whenAt: LocalDateTime) {
        val user = userRepo.findById(userId).orElseThrow()
        user.lastLoginAt = whenAt
        userRepo.save(user)
    }

    override fun isAdmin(userId: Long): Boolean = adminRepo.existsByUser_Id(userId)

    @Transactional
    override fun grantAdmin(userId: Long) {
        if (adminRepo.existsByUser_Id(userId)) {
            return
        }
        val user = userRepo.findById(userId).orElseThrow { EntityNotFoundException("User not found: $userId") }
        adminRepo.save(AdminEntity(user = user))
    }

    @Transactional
    override fun revokeAdmin(userId: Long): Boolean {
        val admin = adminRepo.findByUser_Id(userId) ?: return false
        adminRepo.delete(admin)
        return true
    }

    override fun saveRefreshToken(userId: Long, tokenHash: String, expiresAt: LocalDateTime) {
        val user = userRepo.findById(userId).orElseThrow()
        refreshRepo.save(RefreshTokenEntity(user = user, tokenHash = tokenHash, expiresAt = expiresAt))
    }

    @Transactional
    override fun revokeRefreshToken(tokenHash: String): Boolean {
        val entity = refreshRepo.findByTokenHash(tokenHash) ?: return false
        if (entity.revokedAt != null) return false
        entity.revokedAt = LocalDateTime.now()
        refreshRepo.save(entity)
        return true
    }

    @Transactional
    override fun revokeAllRefreshTokens(userId: Long) {
        refreshRepo.revokeAll(userId, LocalDateTime.now())
    }

    override fun existsActiveRefreshToken(tokenHash: String, now: LocalDateTime): Boolean =
        refreshRepo.existsActive(tokenHash, now)

    @Transactional
    override fun markUserUnlinked(userKey: Long): Long? {
        val user = userRepo.findByUserKey(userKey) ?: return null
        user.status = "UNLINKED"
        userRepo.save(user)
        return user.id
    }

    override fun saveUnlinkEvent(userKey: Long, referrer: String, rawPayload: String?) {
        unlinkRepo.save(TossUnlinkEventEntity(userKey = userKey, referrer = referrer, rawPayload = rawPayload))
    }
}
