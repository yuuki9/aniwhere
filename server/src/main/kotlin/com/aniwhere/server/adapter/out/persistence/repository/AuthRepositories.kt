package com.aniwhere.server.adapter.out.persistence.repository

import com.aniwhere.server.adapter.out.persistence.entity.AdminEntity
import com.aniwhere.server.adapter.out.persistence.entity.RefreshTokenEntity
import com.aniwhere.server.adapter.out.persistence.entity.TossUnlinkEventEntity
import com.aniwhere.server.adapter.out.persistence.entity.UserEntity
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Modifying
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import java.time.LocalDateTime

interface UserRepository : JpaRepository<UserEntity, Long> {
    fun findByUserKey(userKey: Long): UserEntity?
    fun existsByNicknameIgnoreCase(nickname: String): Boolean
    fun existsByNicknameIgnoreCaseAndIdNot(nickname: String, id: Long): Boolean

    @Query(
        value = """
            select u
            from UserEntity u
            left join AdminEntity a on a.user = u
            where (
                :keyword is null
                or lower(coalesce(u.nickname, '')) like lower(concat('%', :keyword, '%'))
                or str(u.userKey) like concat('%', :keyword, '%')
                or lower(u.status) like lower(concat('%', :keyword, '%'))
                or (:keywordRole = 'ADMIN' and a.id is not null)
                or (:keywordRole = 'USER' and a.id is null)
            )
            and (
                :role is null
                or (:role = 'ADMIN' and a.id is not null)
                or (:role = 'USER' and a.id is null)
            )
        """,
        countQuery = """
            select count(u)
            from UserEntity u
            left join AdminEntity a on a.user = u
            where (
                :keyword is null
                or lower(coalesce(u.nickname, '')) like lower(concat('%', :keyword, '%'))
                or str(u.userKey) like concat('%', :keyword, '%')
                or lower(u.status) like lower(concat('%', :keyword, '%'))
                or (:keywordRole = 'ADMIN' and a.id is not null)
                or (:keywordRole = 'USER' and a.id is null)
            )
            and (
                :role is null
                or (:role = 'ADMIN' and a.id is not null)
                or (:role = 'USER' and a.id is null)
            )
        """,
    )
    fun searchUsers(
        @Param("keyword") keyword: String?,
        @Param("keywordRole") keywordRole: String?,
        @Param("role") role: String?,
        pageable: Pageable,
    ): Page<UserEntity>
}

interface AdminRepository : JpaRepository<AdminEntity, Long> {
    fun existsByUser_Id(userId: Long): Boolean

    fun findByUser_Id(userId: Long): AdminEntity?
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
