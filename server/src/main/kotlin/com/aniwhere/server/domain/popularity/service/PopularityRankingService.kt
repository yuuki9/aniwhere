package com.aniwhere.server.domain.popularity.service

import com.aniwhere.server.domain.popularity.model.KeywordRankingItem
import com.aniwhere.server.domain.popularity.model.KeywordRankingResponse
import com.aniwhere.server.domain.popularity.model.MixedEntityRankingItem
import com.aniwhere.server.domain.popularity.model.MixedEntityRankingResponse
import com.aniwhere.server.domain.popularity.model.PopularityRankingKind
import com.aniwhere.server.domain.popularity.model.PopularityWindow
import com.aniwhere.server.domain.popularity.model.ShopRankingItem
import com.aniwhere.server.domain.popularity.model.ShopRankingResponse
import com.aniwhere.server.domain.popularity.model.WorkRankingItem
import com.aniwhere.server.domain.popularity.model.WorkRankingResponse
import com.aniwhere.server.domain.popularity.port.`in`.PopularityRankingUseCase
import com.aniwhere.server.domain.popularity.port.out.PopularityEntityScoreRow
import com.aniwhere.server.domain.popularity.port.out.PopularityPersistencePort
import com.aniwhere.server.domain.popularity.port.out.PopularityStaticShopRow
import com.aniwhere.server.domain.popularity.port.out.PopularityStaticWorkRow
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.LocalDateTime

@Service
@Transactional(readOnly = true)
class PopularityRankingService(
    private val port: PopularityPersistencePort,
) : PopularityRankingUseCase {

    override fun shopRankings(window: PopularityWindow, limit: Int): ShopRankingResponse {
        val resolvedLimit = limit.coerceIn(MIN_LIMIT, MAX_SHOP_LIMIT)
        val since = windowStart(window)
        val sampleSufficient = port.countEventsSince(since) >= SAMPLE_SUFFICIENT_THRESHOLD
        val eventRows = port.aggregateShopScores(since, resolvedLimit)
        val merged = mergeShopRows(eventRows, port.findTopShopsByStaticSignals(resolvedLimit), sampleSufficient, resolvedLimit)
        val labels = port.findShopLabels(merged.mapNotNull { it.shopId })
        val items = merged.mapIndexed { index, row ->
            ShopRankingItem(
                rank = index + 1,
                shopId = row.shopId!!,
                label = labels[row.shopId] ?: "매장",
                score = row.score,
                eventCount = row.eventCount,
            )
        }
        return ShopRankingResponse(window = window.toApiValue(), sampleSufficient = sampleSufficient, items = items)
    }

    override fun workRankings(window: PopularityWindow, limit: Int): WorkRankingResponse {
        val resolvedLimit = limit.coerceIn(MIN_LIMIT, MAX_WORK_LIMIT)
        val since = windowStart(window)
        val sampleSufficient = port.countEventsSince(since) >= SAMPLE_SUFFICIENT_THRESHOLD
        val eventRows = port.aggregateWorkScores(since, resolvedLimit)
        val merged = mergeWorkRows(eventRows, port.findTopWorksByPopularity(resolvedLimit), sampleSufficient, resolvedLimit)
        val labels = port.findWorkLabels(merged.mapNotNull { it.workId })
        val items = merged.mapIndexed { index, row ->
            WorkRankingItem(
                rank = index + 1,
                workId = row.workId!!,
                label = labels[row.workId] ?: "작품",
                score = row.score,
                eventCount = row.eventCount,
            )
        }
        return WorkRankingResponse(window = window.toApiValue(), sampleSufficient = sampleSufficient, items = items)
    }

    override fun keywordRankings(window: PopularityWindow, limit: Int): KeywordRankingResponse {
        val resolvedLimit = limit.coerceIn(MIN_LIMIT, MAX_KEYWORD_LIMIT)
        val since = windowStart(window)
        val sampleSufficient = port.countEventsSince(since) >= SAMPLE_SUFFICIENT_THRESHOLD
        val rows = port.aggregateKeywordScores(since, resolvedLimit)
        val items = rows.mapIndexed { index, row ->
            KeywordRankingItem(
                rank = index + 1,
                keyword = row.keyword!!,
                score = row.score,
                eventCount = row.eventCount,
            )
        }
        return KeywordRankingResponse(window = window.toApiValue(), sampleSufficient = sampleSufficient, items = items)
    }

    override fun mixedEntityRankings(window: PopularityWindow, limit: Int): MixedEntityRankingResponse {
        val resolvedLimit = limit.coerceIn(MIN_LIMIT, MAX_MIXED_LIMIT)
        val since = windowStart(window)
        val sampleSufficient = port.countEventsSince(since) >= SAMPLE_SUFFICIENT_THRESHOLD
        val shopRows = port.aggregateShopScores(since, resolvedLimit)
        val workRows = port.aggregateWorkScores(since, resolvedLimit)
        val mergedShops = mergeShopRows(shopRows, port.findTopShopsByStaticSignals(resolvedLimit), sampleSufficient, resolvedLimit)
        val mergedWorks = mergeWorkRows(workRows, port.findTopWorksByPopularity(resolvedLimit), sampleSufficient, resolvedLimit)

        val shopLabels = port.findShopLabels(mergedShops.mapNotNull { it.shopId })
        val workLabels = port.findWorkLabels(mergedWorks.mapNotNull { it.workId })

        val combined = buildList {
            mergedShops.forEach { row ->
                add(
                    MixedEntityRankingItem(
                        rank = 0,
                        kind = PopularityRankingKind.SHOP,
                        shopId = row.shopId,
                        label = shopLabels[row.shopId] ?: "매장",
                        score = row.score,
                        eventCount = row.eventCount,
                    ),
                )
            }
            mergedWorks.forEach { row ->
                add(
                    MixedEntityRankingItem(
                        rank = 0,
                        kind = PopularityRankingKind.WORK,
                        workId = row.workId,
                        label = workLabels[row.workId] ?: "작품",
                        score = row.score,
                        eventCount = row.eventCount,
                    ),
                )
            }
        }
            .sortedByDescending { it.score }
            .take(resolvedLimit)
            .mapIndexed { index, item -> item.copy(rank = index + 1) }

        return MixedEntityRankingResponse(
            window = window.toApiValue(),
            sampleSufficient = sampleSufficient,
            items = combined,
        )
    }

    private fun mergeShopRows(
        eventRows: List<PopularityEntityScoreRow>,
        staticRows: List<PopularityStaticShopRow>,
        sampleSufficient: Boolean,
        limit: Int,
    ): List<PopularityEntityScoreRow> {
        if (sampleSufficient && eventRows.isNotEmpty()) return eventRows.take(limit)
        val staticScores = staticRows.map { staticShopScore(it) }
        val maxStatic = staticScores.maxOrNull() ?: 0.0
        val boostedEvents = eventRows.map { row ->
            if (maxStatic <= 0.0) row
            else row.copy(score = row.score + maxStatic * STATIC_BLEND_RATIO)
        }
        val seen = boostedEvents.mapNotNull { it.shopId }.toMutableSet()
        val fillers = staticRows
            .filter { it.shopId !in seen }
            .map { row ->
                PopularityEntityScoreRow(
                    shopId = row.shopId,
                    score = staticShopScore(row) * STATIC_BLEND_RATIO,
                    eventCount = 0,
                )
            }
        return (boostedEvents + fillers).sortedByDescending { it.score }.take(limit)
    }

    private fun mergeWorkRows(
        eventRows: List<PopularityEntityScoreRow>,
        staticRows: List<PopularityStaticWorkRow>,
        sampleSufficient: Boolean,
        limit: Int,
    ): List<PopularityEntityScoreRow> {
        if (sampleSufficient && eventRows.isNotEmpty()) return eventRows.take(limit)
        val staticScores = staticRows.map { staticWorkScore(it) }
        val maxStatic = staticScores.maxOrNull() ?: 0.0
        val boostedEvents = eventRows.map { row ->
            if (maxStatic <= 0.0) row
            else row.copy(score = row.score + maxStatic * STATIC_BLEND_RATIO)
        }
        val seen = boostedEvents.mapNotNull { it.workId }.toMutableSet()
        val fillers = staticRows
            .filter { it.workId !in seen }
            .map { row ->
                PopularityEntityScoreRow(
                    workId = row.workId,
                    score = staticWorkScore(row) * STATIC_BLEND_RATIO,
                    eventCount = 0,
                )
            }
        return (boostedEvents + fillers).sortedByDescending { it.score }.take(limit)
    }

    private fun staticShopScore(row: PopularityStaticShopRow): Double =
        row.reviewCount.toDouble() + row.favoriteCount.toDouble() * 0.5

    private fun staticWorkScore(row: PopularityStaticWorkRow): Double =
        (row.popularity ?: 0).toDouble()

    private fun windowStart(window: PopularityWindow): LocalDateTime =
        LocalDateTime.now().minusHours(window.hours)

    private fun PopularityWindow.toApiValue(): String = when (this) {
        PopularityWindow.H24 -> "24h"
        PopularityWindow.D7 -> "7d"
    }

    private companion object {
        const val SAMPLE_SUFFICIENT_THRESHOLD = 50L
        const val STATIC_BLEND_RATIO = 0.2
        const val MIN_LIMIT = 1
        const val MAX_SHOP_LIMIT = 50
        const val MAX_WORK_LIMIT = 50
        const val MAX_KEYWORD_LIMIT = 20
        const val MAX_MIXED_LIMIT = 20
    }
}
