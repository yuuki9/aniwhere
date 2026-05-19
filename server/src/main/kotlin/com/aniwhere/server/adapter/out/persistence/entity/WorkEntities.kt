package com.aniwhere.server.adapter.out.persistence.entity

import jakarta.persistence.*
import org.hibernate.annotations.JdbcTypeCode
import org.hibernate.type.SqlTypes
import java.time.LocalDateTime

@Entity
@Table(name = "works")
@Inheritance(strategy = InheritanceType.JOINED)
@DiscriminatorColumn(name = "dtype")
abstract class WorkEntity(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    open val id: Int? = null,
    @Column(nullable = false, length = 100, unique = true)
    open var name: String,
    @Column(name = "cover_url", length = 1024, nullable = true)
    open var coverUrl: String? = null,
    @Column(name = "created_at", nullable = false, updatable = false)
    open val createdAt: LocalDateTime = LocalDateTime.now(),
    @Column(name = "updated_at", nullable = false)
    open var updatedAt: LocalDateTime = LocalDateTime.now(),
)

@Entity
@DiscriminatorValue("ANIMATION")
@PrimaryKeyJoinColumn(name = "work_id")
class AnimationWorkEntity(
    name: String,
    coverUrl: String? = null,
    createdAt: LocalDateTime = LocalDateTime.now(),
    updatedAt: LocalDateTime = LocalDateTime.now(),
    @Column(name = "anilist_id", nullable = true, columnDefinition = "INT UNSIGNED")
    var anilistId: Long? = null,
    @Column(name = "title_romaji", length = 512, nullable = true)
    var titleRomaji: String? = null,
    @Column(name = "title_english", length = 512, nullable = true)
    var titleEnglish: String? = null,
    @Column(name = "title_native", length = 512, nullable = true)
    var titleNative: String? = null,
    @Column(name = "korean_title", length = 512, nullable = true)
    var koreanTitle: String? = null,
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "json", nullable = true)
    var genres: List<String>? = null,
    @Column(name = "tmdb_logo_url", length = 1024, nullable = true)
    var tmdbLogoUrl: String? = null,
    @Column(nullable = true)
    var popularity: Int? = null,
    @Column(name = "anilist_synced_at", nullable = true)
    var anilistSyncedAt: LocalDateTime? = null,
) : WorkEntity(name = name, coverUrl = coverUrl, createdAt = createdAt, updatedAt = updatedAt)

@Entity
@DiscriminatorValue("GAME")
@PrimaryKeyJoinColumn(name = "work_id")
class GameWorkEntity(
    name: String,
    coverUrl: String? = null,
    createdAt: LocalDateTime = LocalDateTime.now(),
    updatedAt: LocalDateTime = LocalDateTime.now(),
) : WorkEntity(name = name, coverUrl = coverUrl, createdAt = createdAt, updatedAt = updatedAt)
