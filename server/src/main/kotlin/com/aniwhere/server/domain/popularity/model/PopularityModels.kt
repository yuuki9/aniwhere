package com.aniwhere.server.domain.popularity.model

import java.time.LocalDateTime

enum class PopularityEventType(val weight: Int) {
    SEARCH_AUTOCOMPLETE_SELECTED(3),
    SEARCH_KEYWORD_SUBMITTED(2),
    DISCOVERY_WORK_EXPLORE_ENTERED(2),
    DISCOVERY_RESULT_CLICKED(1),
    ;

    companion object {
        fun parse(value: String): PopularityEventType =
            entries.find { it.name.equals(value, ignoreCase = true) }
                ?: throw IllegalArgumentException("Unknown popularity event type: $value")
    }
}

enum class PopularitySearchScope {
    SHOP,
    WORK,
    ;

    companion object {
        fun parse(value: String): PopularitySearchScope =
            entries.find { it.name.equals(value, ignoreCase = true) }
                ?: throw IllegalArgumentException("scope must be shop or work")
    }
}

enum class PopularityDiscoverySource {
    SEARCH,
    EXPLORE,
    ;

    companion object {
        fun parse(value: String): PopularityDiscoverySource =
            entries.find { it.name.equals(value, ignoreCase = true) }
                ?: throw IllegalArgumentException("source must be search or explore")
    }
}

enum class PopularityWindow(val hours: Long) {
    H24(24),
    D7(24 * 7),
    ;

    companion object {
        fun parse(value: String): PopularityWindow =
            when (value.lowercase()) {
                "24h" -> H24
                "7d" -> D7
                else -> throw IllegalArgumentException("window must be 7d or 24h")
            }
    }
}

enum class PopularityRankingKind {
    SHOP,
    WORK,
    KEYWORD,
}

data class RecordPopularityEventCommand(
    val userId: Long,
    val type: PopularityEventType,
    val occurredAt: LocalDateTime,
    val shopId: Long? = null,
    val workId: Int? = null,
    val keyword: String? = null,
    val workKeyword: String? = null,
    val scope: PopularitySearchScope? = null,
    val source: PopularityDiscoverySource? = null,
)

data class PopularityScoreAggregate(
    val score: Double,
    val eventCount: Long,
)

data class ShopRankingItem(
    val rank: Int,
    val shopId: Long,
    val label: String,
    val score: Double,
    val eventCount: Long,
)

data class WorkRankingItem(
    val rank: Int,
    val workId: Int,
    val label: String,
    val score: Double,
    val eventCount: Long,
)

data class KeywordRankingItem(
    val rank: Int,
    val keyword: String,
    val score: Double,
    val eventCount: Long,
)

data class MixedEntityRankingItem(
    val rank: Int,
    val kind: PopularityRankingKind,
    val shopId: Long? = null,
    val workId: Int? = null,
    val label: String,
    val score: Double,
    val eventCount: Long,
)

data class ShopRankingResponse(
    val window: String,
    val sampleSufficient: Boolean,
    val items: List<ShopRankingItem>,
)

data class WorkRankingResponse(
    val window: String,
    val sampleSufficient: Boolean,
    val items: List<WorkRankingItem>,
)

data class KeywordRankingResponse(
    val window: String,
    val sampleSufficient: Boolean,
    val items: List<KeywordRankingItem>,
)

data class MixedEntityRankingResponse(
    val window: String,
    val sampleSufficient: Boolean,
    val items: List<MixedEntityRankingItem>,
)
