package com.aniwhere.server.domain.search.service

import com.aniwhere.server.common.exception.BadRequestException
import com.aniwhere.server.common.text.LikePattern
import com.aniwhere.server.domain.search.model.SearchAutocompleteResponse
import com.aniwhere.server.domain.search.model.SearchAutocompleteScope
import com.aniwhere.server.domain.search.port.`in`.SearchAutocompleteUseCase
import com.aniwhere.server.domain.search.port.out.SearchAutocompletePersistencePort
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
@Transactional(readOnly = true)
class SearchAutocompleteService(
    private val port: SearchAutocompletePersistencePort,
) : SearchAutocompleteUseCase {

    override fun autocomplete(
        query: String,
        scope: SearchAutocompleteScope,
        limit: Int,
    ): SearchAutocompleteResponse {
        val trimmed = query.trim()
        if (trimmed.isEmpty()) {
            throw BadRequestException("검색어를 입력해 주세요.")
        }
        if (trimmed.length > MAX_QUERY_LENGTH) {
            throw BadRequestException("검색어는 ${MAX_QUERY_LENGTH}자 이하로 입력해 주세요.")
        }

        val resolvedLimit = limit.coerceIn(MIN_LIMIT, MAX_LIMIT)
        val pattern = LikePattern.escapeForContains(trimmed)
        val items = when (scope) {
            SearchAutocompleteScope.SHOP -> port.suggestShops(pattern, resolvedLimit)
            SearchAutocompleteScope.WORK -> port.suggestWorks(pattern, resolvedLimit)
        }
        return SearchAutocompleteResponse(items = items)
    }

    private companion object {
        const val MAX_QUERY_LENGTH = 50
        const val MIN_LIMIT = 1
        const val MAX_LIMIT = 20
    }
}
