package com.aniwhere.server.adapter.`in`.web

import com.aniwhere.server.common.dto.ApiResponse
import com.aniwhere.server.common.exception.BadRequestException
import com.aniwhere.server.common.exception.UnauthorizedException
import com.aniwhere.server.config.security.SecurityPrincipal
import com.aniwhere.server.domain.favorite.port.`in`.UserFavoriteUseCase
import com.aniwhere.server.domain.work.model.WorkType
import com.aniwhere.server.domain.work.port.`in`.ListWorksUseCase
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.tags.Tag
import org.springframework.security.core.context.SecurityContextHolder
import org.springframework.web.bind.annotation.DeleteMapping
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController

@Tag(name = "Work", description = "작품(works) 마스터 API")
@RestController
@RequestMapping("/api/v1/works")
class WorkController(
    private val useCase: ListWorksUseCase,
    private val favoriteUseCase: UserFavoriteUseCase,
) {

    @Operation(summary = "등록된 작품 목록 (인기도 내림차순, 동률·미산정은 이름 순). 샵 검색은 `keyword`(샵명)·`workKeyword`(작품명·한글표제)를 각각 사용")
    @GetMapping
    fun listWorks(@RequestParam(required = false) type: String?) =
        ApiResponse.ok(useCase.listWorks(parseWorkTypeOrNull(type)))

    @Operation(summary = "작품 즐겨찾기 추가")
    @PostMapping("/{workId}/favorite")
    fun addFavoriteWork(@PathVariable workId: Int) =
        run { favoriteUseCase.addFavoriteWork(currentUserId(), workId); ApiResponse.ok() }

    @Operation(summary = "작품 즐겨찾기 삭제")
    @DeleteMapping("/{workId}/favorite")
    fun removeFavoriteWork(@PathVariable workId: Int) =
        run { favoriteUseCase.removeFavoriteWork(currentUserId(), workId); ApiResponse.ok() }

    private fun parseWorkTypeOrNull(raw: String?): WorkType? {
        val normalized = raw?.trim()?.takeIf { it.isNotEmpty() } ?: return null
        return runCatching { WorkType.valueOf(normalized.uppercase()) }
            .getOrElse { throw BadRequestException("type must be ANIMATION or GAME") }
    }

    private fun currentUserId(): Long =
        (SecurityContextHolder.getContext().authentication?.principal as? SecurityPrincipal)?.userId
            ?: throw UnauthorizedException("Authentication required")
}
