package com.aniwhere.server.domain.popularity.service

import com.aniwhere.server.common.exception.BadRequestException
import com.aniwhere.server.domain.popularity.PopularityKeywordNormalizer
import com.aniwhere.server.domain.popularity.model.PopularityDiscoverySource
import com.aniwhere.server.domain.popularity.model.PopularityEventType
import com.aniwhere.server.domain.popularity.model.PopularitySearchScope
import com.aniwhere.server.domain.popularity.model.RecordPopularityEventCommand
import com.aniwhere.server.domain.popularity.port.`in`.PopularityEventUseCase
import com.aniwhere.server.domain.popularity.port.out.PopularityPersistencePort
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.LocalDateTime

@Service
class PopularityEventService(
    private val port: PopularityPersistencePort,
) : PopularityEventUseCase {

    @Transactional
    override fun recordEvent(command: RecordPopularityEventCommand) {
        validate(command)
        val since = LocalDateTime.now().minusMinutes(DEBOUNCE_MINUTES)
        if (port.existsRecentDuplicate(command, since)) {
            return
        }
        port.saveEvent(command)
    }

    private fun validate(command: RecordPopularityEventCommand) {
        if (command.userId <= 0) throw BadRequestException("userId must be positive")
        if (command.occurredAt.isAfter(LocalDateTime.now().plusMinutes(5))) {
            throw BadRequestException("occurredAt cannot be in the future")
        }

        when (command.type) {
            PopularityEventType.SEARCH_AUTOCOMPLETE_SELECTED -> {
                val hasShop = command.shopId != null
                val hasWork = command.workId != null
                if (hasShop == hasWork) {
                    throw BadRequestException("shopId or workId is required for SEARCH_AUTOCOMPLETE_SELECTED")
                }
                command.shopId?.let { requireShop(it) }
                command.workId?.let { requireWork(it) }
            }
            PopularityEventType.SEARCH_KEYWORD_SUBMITTED -> {
                val keyword = command.keyword?.trim().orEmpty()
                if (keyword.isEmpty()) throw BadRequestException("keyword is required for SEARCH_KEYWORD_SUBMITTED")
                if (keyword.length > MAX_KEYWORD_LENGTH) {
                    throw BadRequestException("keyword must be at most $MAX_KEYWORD_LENGTH characters")
                }
                command.scope ?: throw BadRequestException("scope is required for SEARCH_KEYWORD_SUBMITTED")
            }
            PopularityEventType.DISCOVERY_WORK_EXPLORE_ENTERED -> {
                val hasWorkId = command.workId != null
                val hasWorkKeyword = !command.workKeyword.isNullOrBlank()
                if (!hasWorkId && !hasWorkKeyword) {
                    throw BadRequestException("workId or workKeyword is required for DISCOVERY_WORK_EXPLORE_ENTERED")
                }
                command.workId?.let { requireWork(it) }
                command.workKeyword?.let { requireKeywordLength(it) }
            }
            PopularityEventType.DISCOVERY_RESULT_CLICKED -> {
                command.source ?: throw BadRequestException("source is required for DISCOVERY_RESULT_CLICKED")
                val hasShop = command.shopId != null
                val hasWork = command.workId != null
                val hasWorkKeyword = !command.workKeyword.isNullOrBlank()
                if (!hasShop && !hasWork && !hasWorkKeyword) {
                    throw BadRequestException(
                        "shopId, workId, or workKeyword is required for DISCOVERY_RESULT_CLICKED",
                    )
                }
                command.shopId?.let { requireShop(it) }
                command.workId?.let { requireWork(it) }
                command.workKeyword?.let { requireKeywordLength(it) }
            }
        }

        command.keyword?.let { requireKeywordLength(it) }
    }

    private fun requireShop(shopId: Long) {
        if (!port.existsShop(shopId)) throw BadRequestException("Shop not found: $shopId")
    }

    private fun requireWork(workId: Int) {
        if (!port.existsWork(workId)) throw BadRequestException("Work not found: $workId")
    }

    private fun requireKeywordLength(keyword: String) {
        val trimmed = keyword.trim()
        if (trimmed.length > MAX_KEYWORD_LENGTH) {
            throw BadRequestException("keyword must be at most $MAX_KEYWORD_LENGTH characters")
        }
        if (PopularityKeywordNormalizer.normalize(trimmed) == null) {
            throw BadRequestException("keyword must not be blank")
        }
    }

    private companion object {
        const val DEBOUNCE_MINUTES = 5L
        const val MAX_KEYWORD_LENGTH = 50
    }
}
