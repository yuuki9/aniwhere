package com.aniwhere.server.adapter.out.persistence

import com.aniwhere.server.adapter.out.persistence.entity.PopularityEventEntity
import com.aniwhere.server.adapter.out.persistence.repository.AnimationWorkRepository
import com.aniwhere.server.adapter.out.persistence.repository.PopularityEventRepository
import com.aniwhere.server.adapter.out.persistence.repository.PopularityScoreProjection
import com.aniwhere.server.adapter.out.persistence.repository.ShopRepository
import com.aniwhere.server.adapter.out.persistence.repository.WorkRepository
import com.aniwhere.server.domain.popularity.PopularityKeywordNormalizer
import com.aniwhere.server.domain.popularity.model.PopularityEventType
import com.aniwhere.server.domain.popularity.model.RecordPopularityEventCommand
import com.aniwhere.server.domain.popularity.port.out.PopularityEntityScoreRow
import com.aniwhere.server.domain.popularity.port.out.PopularityPersistencePort
import com.aniwhere.server.domain.popularity.port.out.PopularityStaticShopRow
import com.aniwhere.server.domain.popularity.port.out.PopularityStaticWorkRow
import org.springframework.data.domain.PageRequest
import org.springframework.data.domain.Sort
import org.springframework.stereotype.Component
import java.time.LocalDateTime

@Component
class PopularityPersistenceAdapter(
    private val eventRepo: PopularityEventRepository,
    private val shopRepo: ShopRepository,
    private val workRepo: WorkRepository,
    private val animationWorkRepo: AnimationWorkRepository,
) : PopularityPersistencePort {

    override fun existsRecentDuplicate(command: RecordPopularityEventCommand, since: LocalDateTime): Boolean {
        val type = command.type.name
        return when (command.type) {
            PopularityEventType.SEARCH_AUTOCOMPLETE_SELECTED -> when {
                command.shopId != null ->
                    eventRepo.existsByUserIdAndEventTypeAndShopIdAndCreatedAtGreaterThanEqual(
                        command.userId, type, command.shopId, since,
                    )
                command.workId != null ->
                    eventRepo.existsByUserIdAndEventTypeAndWorkIdAndCreatedAtGreaterThanEqual(
                        command.userId, type, command.workId, since,
                    )
                else -> false
            }
            PopularityEventType.SEARCH_KEYWORD_SUBMITTED -> {
                val normalized = PopularityKeywordNormalizer.normalize(command.keyword) ?: return false
                eventRepo.existsByUserIdAndEventTypeAndKeywordNormalizedAndScopeAndCreatedAtGreaterThanEqual(
                    command.userId,
                    type,
                    normalized,
                    command.scope!!.name.lowercase(),
                    since,
                )
            }
            PopularityEventType.DISCOVERY_WORK_EXPLORE_ENTERED -> when {
                command.workId != null ->
                    eventRepo.existsByUserIdAndEventTypeAndWorkIdAndCreatedAtGreaterThanEqual(
                        command.userId, type, command.workId, since,
                    )
                else -> {
                    val normalized = PopularityKeywordNormalizer.normalize(command.workKeyword) ?: return false
                    eventRepo.existsByUserIdAndEventTypeAndWorkKeywordNormalizedAndCreatedAtGreaterThanEqual(
                        command.userId, type, normalized, since,
                    )
                }
            }
            PopularityEventType.DISCOVERY_RESULT_CLICKED -> when {
                command.shopId != null ->
                    eventRepo.existsByUserIdAndEventTypeAndShopIdAndSourceAndCreatedAtGreaterThanEqual(
                        command.userId,
                        type,
                        command.shopId,
                        command.source!!.name.lowercase(),
                        since,
                    )
                command.workId != null ->
                    eventRepo.existsByUserIdAndEventTypeAndWorkIdAndSourceAndCreatedAtGreaterThanEqual(
                        command.userId,
                        type,
                        command.workId,
                        command.source!!.name.lowercase(),
                        since,
                    )
                else -> {
                    val normalized = PopularityKeywordNormalizer.normalize(command.workKeyword) ?: return false
                    eventRepo.existsByUserIdAndEventTypeAndWorkKeywordNormalizedAndCreatedAtGreaterThanEqual(
                        command.userId, type, normalized, since,
                    )
                }
            }
        }
    }

    override fun saveEvent(command: RecordPopularityEventCommand) {
        val keywordNormalized = PopularityKeywordNormalizer.normalize(command.keyword)
        val workKeywordNormalized = PopularityKeywordNormalizer.normalize(command.workKeyword)
        eventRepo.save(
            PopularityEventEntity(
                userId = command.userId,
                eventType = command.type.name,
                shopId = command.shopId,
                workId = command.workId,
                keyword = command.keyword?.trim()?.takeIf { it.isNotEmpty() },
                keywordNormalized = keywordNormalized,
                workKeyword = command.workKeyword?.trim()?.takeIf { it.isNotEmpty() },
                workKeywordNormalized = workKeywordNormalized,
                scope = command.scope?.name?.lowercase(),
                source = command.source?.name?.lowercase(),
                occurredAt = command.occurredAt,
            ),
        )
    }

    override fun countEventsSince(since: LocalDateTime): Long =
        eventRepo.countByOccurredAtGreaterThanEqual(since)

    override fun aggregateShopScores(since: LocalDateTime, limit: Int): List<PopularityEntityScoreRow> =
        eventRepo.aggregateShopScores(since, limit).map(::toScoreRow)

    override fun aggregateWorkScores(since: LocalDateTime, limit: Int): List<PopularityEntityScoreRow> =
        eventRepo.aggregateWorkScores(since, limit).map(::toScoreRow)

    override fun aggregateKeywordScores(since: LocalDateTime, limit: Int): List<PopularityEntityScoreRow> =
        eventRepo.aggregateKeywordScores(since, limit).map(::toScoreRow)

    override fun findShopLabels(shopIds: Collection<Long>): Map<Long, String> {
        if (shopIds.isEmpty()) return emptyMap()
        return shopRepo.findAllById(shopIds).associate { requireNotNull(it.id) to it.name }
    }

    override fun findWorkLabels(workIds: Collection<Int>): Map<Int, String> {
        if (workIds.isEmpty()) return emptyMap()
        return workRepo.findAllById(workIds).associate { requireNotNull(it.id) to it.name }
    }

    override fun findTopShopsByStaticSignals(limit: Int): List<PopularityStaticShopRow> {
        val page = shopRepo.findAll(
            PageRequest.of(0, limit, Sort.by(Sort.Order.desc("reviewCount"), Sort.Order.asc("id"))),
        )
        return page.content.map { shop ->
            PopularityStaticShopRow(
                shopId = requireNotNull(shop.id),
                label = shop.name,
                reviewCount = shop.reviewCount,
                favoriteCount = shop.favoriteCount,
            )
        }
    }

    override fun findTopWorksByPopularity(limit: Int): List<PopularityStaticWorkRow> {
        return animationWorkRepo.findAllOrderByPopularityDesc()
            .take(limit)
            .map { work ->
                PopularityStaticWorkRow(
                    workId = requireNotNull(work.id),
                    label = work.name,
                    popularity = work.popularity,
                )
            }
    }

    override fun existsShop(shopId: Long): Boolean = shopRepo.existsById(shopId)

    override fun existsWork(workId: Int): Boolean = workRepo.existsById(workId)

    private fun toScoreRow(projection: PopularityScoreProjection): PopularityEntityScoreRow =
        PopularityEntityScoreRow(
            shopId = projection.getShopId(),
            workId = projection.getWorkId(),
            keyword = projection.getKeyword(),
            score = projection.getScore(),
            eventCount = projection.getEventCount(),
        )
}
