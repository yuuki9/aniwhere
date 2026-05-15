package com.aniwhere.server.adapter.out.persistence.entity

import jakarta.persistence.*
import org.hibernate.annotations.JdbcTypeCode
import org.hibernate.type.SqlTypes
import java.time.LocalDateTime

@Entity
@Table(name = "categories")
class CategoryEntity(
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Short? = null,
    @Column(nullable = false, length = 50, unique = true) val name: String,
)

@Entity
@Table(name = "works")
class WorkEntity(
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Int? = null,

    @Column(nullable = false, length = 100, unique = true)
    val name: String,

    @Column(name = "anilist_id", nullable = true, columnDefinition = "INT UNSIGNED")
    val anilistId: Long? = null,

    @Column(name = "title_romaji", length = 512, nullable = true)
    val titleRomaji: String? = null,

    @Column(name = "title_english", length = 512, nullable = true)
    val titleEnglish: String? = null,

    @Column(name = "title_native", length = 512, nullable = true)
    val titleNative: String? = null,

    @Column(name = "korean_title", length = 512, nullable = true)
    val koreanTitle: String? = null,

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "json", nullable = true)
    val genres: List<String>? = null,

    @Column(name = "cover_url", length = 1024, nullable = true)
    val coverUrl: String? = null,

    @Column(name = "tmdb_logo_url", length = 1024, nullable = true)
    val tmdbLogoUrl: String? = null,

    @Column(nullable = true)
    val popularity: Int? = null,

    @Column(name = "anilist_synced_at", nullable = true)
    val anilistSyncedAt: LocalDateTime? = null,
)
