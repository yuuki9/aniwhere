package com.aniwhere.server.domain.search.port.`in`

import com.aniwhere.server.domain.search.model.SearchAutocompleteResponse
import com.aniwhere.server.domain.search.model.SearchAutocompleteScope

fun interface SearchAutocompleteUseCase {
    fun autocomplete(
        query: String,
        scope: SearchAutocompleteScope,
        limit: Int,
    ): SearchAutocompleteResponse
}
