package com.aniwhere.server.domain.search.model

enum class SearchAutocompleteKind {
    SHOP,
    WORK,
}

enum class SearchAutocompleteScope {
    SHOP,
    WORK,
    ;

    companion object {
        fun parse(raw: String): SearchAutocompleteScope {
            return when (raw.trim().lowercase()) {
                "shop" -> SHOP
                "work" -> WORK
                else -> throw IllegalArgumentException("scope must be shop or work")
            }
        }
    }
}

data class SearchAutocompleteItem(
    val label: String,
    val kind: SearchAutocompleteKind,
    val shopId: Long? = null,
    val workId: Int? = null,
)

data class SearchAutocompleteResponse(
    val items: List<SearchAutocompleteItem>,
)
