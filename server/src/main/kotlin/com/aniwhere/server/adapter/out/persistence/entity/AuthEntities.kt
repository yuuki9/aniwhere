package com.aniwhere.server.adapter.out.persistence.entity

import jakarta.persistence.*
import java.time.LocalDateTime

@Entity
@Table(name = "users")
class UserEntity(
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long? = null,
    @Column(name = "user_key", nullable = false, unique = true)
    var userKey: Long,
    @Column(nullable = false, length = 20)
    var status: String = "ACTIVE",
    @Column(name = "last_login_at")
    var lastLoginAt: LocalDateTime? = null,
    @Column(name = "created_at", nullable = false, updatable = false)
    val createdAt: LocalDateTime = LocalDateTime.now(),
    @Column(name = "updated_at", nullable = false)
    var updatedAt: LocalDateTime = LocalDateTime.now(),
)

@Entity
@Table(name = "admins")
class AdminEntity(
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long? = null,
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    val user: UserEntity,
    @Column(nullable = false, length = 30)
    val role: String = "ADMIN",
    @Column(name = "created_at", nullable = false, updatable = false)
    val createdAt: LocalDateTime = LocalDateTime.now(),
)

@Entity
@Table(name = "refresh_tokens")
class RefreshTokenEntity(
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long? = null,
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    val user: UserEntity,
    @Column(name = "token_hash", nullable = false, unique = true, length = 255)
    val tokenHash: String,
    @Column(name = "expires_at", nullable = false)
    val expiresAt: LocalDateTime,
    @Column(name = "revoked_at")
    var revokedAt: LocalDateTime? = null,
    @Column(name = "created_at", nullable = false, updatable = false)
    val createdAt: LocalDateTime = LocalDateTime.now(),
)

@Entity
@Table(name = "toss_unlink_events")
class TossUnlinkEventEntity(
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long? = null,
    @Column(name = "user_key", nullable = false)
    val userKey: Long,
    @Column(nullable = false, length = 40)
    val referrer: String,
    @Column(name = "raw_payload", columnDefinition = "json")
    val rawPayload: String? = null,
    @Column(name = "received_at", nullable = false, updatable = false)
    val receivedAt: LocalDateTime = LocalDateTime.now(),
)
