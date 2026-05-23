package com.aniwhere.server.adapter.out.persistence.repository

import com.aniwhere.server.adapter.out.persistence.entity.AdminEntity
import com.aniwhere.server.adapter.out.persistence.entity.RefreshTokenEntity
import com.aniwhere.server.adapter.out.persistence.entity.TossUnlinkEventEntity
import com.aniwhere.server.adapter.out.persistence.entity.UserEntity
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Modifying
import org.springframework.data.jpa.repository.Query
import java.time.LocalDateTime

interface UserRepository : JpaRepository<UserEntity, Long> {
    fun findByUserKey(userKey: Long): UserEntity?
    fun existsByNicknameIgnoreCase(nickname: String): Boolean
    fun existsByNicknameIgnoreCaseAndIdNot(nickname: String, id: Long): Boolean
}

interface AdminRepository : JpaRepository<AdminEntity, Long> {
    fun existsByUser_Id(userId: Long): Boolean
}

interface RefreshTokenRepository : JpaRepository<RefreshTokenEntity, Long> {
    fun findByTokenHash(tokenHash: String): RefreshTokenEntity?

    @Query(
        "select count(rt) > 0 from RefreshTokenEntity rt where rt.tokenHash = :tokenHash and rt.revokedAt is null and rt.expiresAt > :now",
    )
    fun existsActive(tokenHash: String, now: LocalDateTime): Boolean

    @Modifying(clearAutomatically = true)
    @Query(
        "update RefreshTokenEntity rt set rt.revokedAt = :now where rt.user.id = :userId and rt.revokedAt is null",
    )
    fun revokeAll(userId: Long, now: LocalDateTime): Int
}

interface TossUnlinkEventRepository : JpaRepository<TossUnlinkEventEntity, Long>
