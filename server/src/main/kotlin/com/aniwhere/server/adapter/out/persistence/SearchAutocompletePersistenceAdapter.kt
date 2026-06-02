package com.aniwhere.server.adapter.out.persistence

import com.aniwhere.server.adapter.out.persistence.entity.AnimationWorkEntity
import com.aniwhere.server.adapter.out.persistence.entity.WorkEntity
import com.aniwhere.server.adapter.out.persistence.repository.ShopRepository
import com.aniwhere.server.adapter.out.persistence.repository.WorkRepository
import com.aniwhere.server.domain.search.model.SearchAutocompleteItem
import com.aniwhere.server.domain.search.model.SearchAutocompleteKind
import com.aniwhere.server.domain.search.port.out.SearchAutocompletePersistencePort
import org.springframework.data.domain.PageRequest
import org.springframework.stereotype.Component

@Component
class SearchAutocompletePersistenceAdapter(
    private val shopRepo: ShopRepository,
    private val workRepo: WorkRepository,
) : SearchAutocompletePersistencePort {

    override fun suggestShops(pattern: String, limit: Int): List<SearchAutocompleteItem> =
        shopRepo.suggestShopNames(pattern, PageRequest.of(0, limit))
            .map { row ->
                SearchAutocompleteItem(
                    label = row.name,
                    kind = SearchAutocompleteKind.SHOP,
                    shopId = row.id,
                )
            }

    override fun suggestWorks(pattern: String, limit: Int): List<SearchAutocompleteItem> =
        workRepo.suggestWorks(pattern, PageRequest.of(0, limit))
            .map { work -> toWorkItem(work) }

    private fun toWorkItem(work: WorkEntity): SearchAutocompleteItem {
        val id = checkNotNull(work.id) { "work id absent" }
        val label = when (work) {
            is AnimationWorkEntity -> work.koreanTitle?.takeIf { it.isNotBlank() } ?: work.name
            else -> work.name
        }
        return SearchAutocompleteItem(
            label = label,
            kind = SearchAutocompleteKind.WORK,
            workId = id,
        )
    }
}
