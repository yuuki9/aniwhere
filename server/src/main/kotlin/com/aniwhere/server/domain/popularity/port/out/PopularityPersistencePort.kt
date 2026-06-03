package com.aniwhere.server.domain.popularity.port.out

import com.aniwhere.server.domain.popularity.model.PopularityEventType
import com.aniwhere.server.domain.popularity.model.RecordPopularityEventCommand
import java.time.LocalDateTime

data class PopularityEntityScoreRow(
    val shopId: Long? = null,
    val workId: Int? = null,
    val keyword: String? = null,
    val score: Double,
    val eventCount: Long,
)

data class PopularityStaticShopRow(
    val shopId: Long,
    val label: String,
    val reviewCount: Int,
    val favoriteCount: Int,
)

data class PopularityStaticWorkRow(
    val workId: Int,
    val label: String,
    val popularity: Int?,
)

interface PopularityPersistencePort {
    fun existsRecentDuplicate(command: RecordPopularityEventCommand, since: LocalDateTime): Boolean
    fun saveEvent(command: RecordPopularityEventCommand)
    fun countEventsSince(since: LocalDateTime): Long
    fun aggregateShopScores(since: LocalDateTime, limit: Int): List<PopularityEntityScoreRow>
    fun aggregateWorkScores(since: LocalDateTime, limit: Int): List<PopularityEntityScoreRow>
    fun aggregateKeywordScores(since: LocalDateTime, limit: Int): List<PopularityEntityScoreRow>
    fun findShopLabels(shopIds: Collection<Long>): Map<Long, String>
    fun findWorkLabels(workIds: Collection<Int>): Map<Int, String>
    fun findTopShopsByStaticSignals(limit: Int): List<PopularityStaticShopRow>
    fun findTopWorksByPopularity(limit: Int): List<PopularityStaticWorkRow>
    fun existsShop(shopId: Long): Boolean
    fun existsWork(workId: Int): Boolean
}
