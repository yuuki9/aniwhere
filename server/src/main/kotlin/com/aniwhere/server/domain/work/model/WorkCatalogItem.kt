package com.aniwhere.server.domain.work.model

import java.time.LocalDateTime

data class WorkCatalogItem(
    val id: Int,
    val name: String,
    val anilistId: Long? = null,
    val titleRomaji: String? = null,
    val titleEnglish: String? = null,
    val titleNative: String? = null,
    val koreanTitle: String? = null,
    val genres: List<String>? = null,
    val coverUrl: String? = null,
    val tmdbLogoUrl: String? = null,
    val popularity: Int? = null,
    val anilistSyncedAt: LocalDateTime? = null,
)
