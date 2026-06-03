package com.aniwhere.server.adapter.out.persistence.repository

import com.aniwhere.server.adapter.out.persistence.entity.PopularityEventEntity
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import java.time.LocalDateTime

interface PopularityScoreProjection {
    fun getShopId(): Long?
    fun getWorkId(): Int?
    fun getKeyword(): String?
    fun getScore(): Double
    fun getEventCount(): Long
}

interface PopularityEventRepository : JpaRepository<PopularityEventEntity, Long> {
    fun countByOccurredAtGreaterThanEqual(since: LocalDateTime): Long

    fun existsByUserIdAndEventTypeAndShopIdAndCreatedAtGreaterThanEqual(
        userId: Long,
        eventType: String,
        shopId: Long,
        since: LocalDateTime,
    ): Boolean

    fun existsByUserIdAndEventTypeAndWorkIdAndCreatedAtGreaterThanEqual(
        userId: Long,
        eventType: String,
        workId: Int,
        since: LocalDateTime,
    ): Boolean

    fun existsByUserIdAndEventTypeAndKeywordNormalizedAndScopeAndCreatedAtGreaterThanEqual(
        userId: Long,
        eventType: String,
        keywordNormalized: String,
        scope: String,
        since: LocalDateTime,
    ): Boolean

    fun existsByUserIdAndEventTypeAndWorkKeywordNormalizedAndCreatedAtGreaterThanEqual(
        userId: Long,
        eventType: String,
        workKeywordNormalized: String,
        since: LocalDateTime,
    ): Boolean

    fun existsByUserIdAndEventTypeAndShopIdAndSourceAndCreatedAtGreaterThanEqual(
        userId: Long,
        eventType: String,
        shopId: Long,
        source: String,
        since: LocalDateTime,
    ): Boolean

    fun existsByUserIdAndEventTypeAndWorkIdAndSourceAndCreatedAtGreaterThanEqual(
        userId: Long,
        eventType: String,
        workId: Int,
        source: String,
        since: LocalDateTime,
    ): Boolean

    @Query(
        value = """
        SELECT e.shop_id AS shopId, NULL AS workId, NULL AS keyword,
               SUM(CASE e.event_type
                   WHEN 'SEARCH_AUTOCOMPLETE_SELECTED' THEN 3
                   WHEN 'SEARCH_KEYWORD_SUBMITTED' THEN 2
                   WHEN 'DISCOVERY_WORK_EXPLORE_ENTERED' THEN 2
                   WHEN 'DISCOVERY_RESULT_CLICKED' THEN 1
                   ELSE 0 END) AS score,
               COUNT(*) AS eventCount
        FROM popularity_events e
        WHERE e.occurred_at >= :since AND e.shop_id IS NOT NULL
        GROUP BY e.shop_id
        ORDER BY score DESC, eventCount DESC, e.shop_id ASC
        LIMIT :limit
        """,
        nativeQuery = true,
    )
    fun aggregateShopScores(
        @Param("since") since: LocalDateTime,
        @Param("limit") limit: Int,
    ): List<PopularityScoreProjection>

    @Query(
        value = """
        SELECT NULL AS shopId, e.work_id AS workId, NULL AS keyword,
               SUM(CASE e.event_type
                   WHEN 'SEARCH_AUTOCOMPLETE_SELECTED' THEN 3
                   WHEN 'SEARCH_KEYWORD_SUBMITTED' THEN 2
                   WHEN 'DISCOVERY_WORK_EXPLORE_ENTERED' THEN 2
                   WHEN 'DISCOVERY_RESULT_CLICKED' THEN 1
                   ELSE 0 END) AS score,
               COUNT(*) AS eventCount
        FROM popularity_events e
        WHERE e.occurred_at >= :since AND e.work_id IS NOT NULL
        GROUP BY e.work_id
        ORDER BY score DESC, eventCount DESC, e.work_id ASC
        LIMIT :limit
        """,
        nativeQuery = true,
    )
    fun aggregateWorkScores(
        @Param("since") since: LocalDateTime,
        @Param("limit") limit: Int,
    ): List<PopularityScoreProjection>

    @Query(
        value = """
        SELECT NULL AS shopId, NULL AS workId,
               MIN(k.keyword_display) AS keyword,
               SUM(k.weight) AS score,
               COUNT(*) AS eventCount
        FROM (
            SELECT COALESCE(e.keyword_normalized, e.work_keyword_normalized) AS keyword_key,
                   COALESCE(e.keyword, e.work_keyword) AS keyword_display,
                   CASE e.event_type
                       WHEN 'SEARCH_AUTOCOMPLETE_SELECTED' THEN 3
                       WHEN 'SEARCH_KEYWORD_SUBMITTED' THEN 2
                       WHEN 'DISCOVERY_WORK_EXPLORE_ENTERED' THEN 2
                       WHEN 'DISCOVERY_RESULT_CLICKED' THEN 1
                       ELSE 0 END AS weight
            FROM popularity_events e
            WHERE e.occurred_at >= :since
              AND COALESCE(e.keyword_normalized, e.work_keyword_normalized) IS NOT NULL
        ) k
        GROUP BY k.keyword_key
        ORDER BY score DESC, eventCount DESC, k.keyword_key ASC
        LIMIT :limit
        """,
        nativeQuery = true,
    )
    fun aggregateKeywordScores(
        @Param("since") since: LocalDateTime,
        @Param("limit") limit: Int,
    ): List<PopularityScoreProjection>
}
