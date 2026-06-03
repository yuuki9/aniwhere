package com.aniwhere.server.domain.popularity

object PopularityKeywordNormalizer {
    fun normalize(raw: String?): String? {
        val trimmed = raw?.trim().orEmpty()
        if (trimmed.isEmpty()) return null
        return trimmed.lowercase()
    }
}
