package com.aniwhere.server.adapter.`in`.web

import com.aniwhere.server.common.exception.BadRequestException
import com.aniwhere.server.common.exception.UnauthorizedException
import com.aniwhere.server.config.security.SecurityPrincipal
import com.aniwhere.server.domain.popularity.model.PopularityDiscoverySource
import com.aniwhere.server.domain.popularity.model.PopularityEventType
import com.aniwhere.server.domain.popularity.model.PopularitySearchScope
import com.aniwhere.server.domain.popularity.model.RecordPopularityEventCommand
import com.aniwhere.server.domain.popularity.port.`in`.PopularityEventUseCase
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.tags.Tag
import org.springframework.http.HttpStatus
import org.springframework.security.core.context.SecurityContextHolder
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.ResponseStatus
import org.springframework.web.bind.annotation.RestController
import java.time.LocalDateTime

@Tag(name = "Popularity", description = "인기도 이벤트 수집 API")
@RestController
@RequestMapping("/api/v1/popularity")
class PopularityEventController(
    private val useCase: PopularityEventUseCase,
) {

    @Operation(
        summary = "인기도 이벤트 기록",
        description = "검색·탐색 행동 이벤트를 기록한다. 동일 사용자·유형·대상은 5분 내 중복 집계하지 않는다.",
    )
    @PostMapping("/events")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    fun recordEvent(@RequestBody body: RecordPopularityEventRequest) {
        val userId = currentUserId()
        useCase.recordEvent(
            RecordPopularityEventCommand(
                userId = userId,
                type = parseEventType(body.type),
                occurredAt = body.occurredAt ?: LocalDateTime.now(),
                shopId = body.shopId,
                workId = body.workId,
                keyword = body.keyword,
                workKeyword = body.workKeyword,
                scope = body.scope?.let { parseScope(it) },
                source = body.source?.let { parseSource(it) },
            ),
        )
    }

    private fun parseEventType(raw: String): PopularityEventType =
        try {
            PopularityEventType.parse(raw)
        } catch (e: IllegalArgumentException) {
            throw BadRequestException(e.message ?: "Invalid event type")
        }

    private fun parseScope(raw: String): PopularitySearchScope =
        try {
            PopularitySearchScope.parse(raw)
        } catch (e: IllegalArgumentException) {
            throw BadRequestException(e.message ?: "Invalid scope")
        }

    private fun parseSource(raw: String): PopularityDiscoverySource =
        try {
            PopularityDiscoverySource.parse(raw)
        } catch (e: IllegalArgumentException) {
            throw BadRequestException(e.message ?: "Invalid source")
        }

    private fun currentUserId(): Long =
        (SecurityContextHolder.getContext().authentication?.principal as? SecurityPrincipal)?.userId
            ?: throw UnauthorizedException("Authentication required")

    data class RecordPopularityEventRequest(
        val type: String,
        val occurredAt: LocalDateTime? = null,
        val shopId: Long? = null,
        val workId: Int? = null,
        val keyword: String? = null,
        val workKeyword: String? = null,
        val scope: String? = null,
        val source: String? = null,
    )
}
