package com.aniwhere.server.domain.search.port.out

import com.aniwhere.server.domain.search.model.SearchAutocompleteItem

interface SearchAutocompletePersistencePort {
    fun suggestShops(pattern: String, limit: Int): List<SearchAutocompleteItem>

    fun suggestWorks(pattern: String, limit: Int): List<SearchAutocompleteItem>
}
