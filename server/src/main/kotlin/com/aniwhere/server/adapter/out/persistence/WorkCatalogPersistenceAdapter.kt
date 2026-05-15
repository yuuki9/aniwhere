package com.aniwhere.server.adapter.out.persistence

import com.aniwhere.server.adapter.out.persistence.repository.WorkRepository
import com.aniwhere.server.domain.work.model.WorkCatalogItem
import com.aniwhere.server.domain.work.port.out.WorkCatalogPersistencePort
import org.springframework.stereotype.Component

@Component
class WorkCatalogPersistenceAdapter(
    private val workRepo: WorkRepository,
) : WorkCatalogPersistencePort {

    override fun findAllOrderedByPopularityDesc(): List<WorkCatalogItem> =
        workRepo.findAllOrderByPopularityDesc().map { e ->
            WorkCatalogItem(
                id = checkNotNull(e.id) { "work id absent" },
                name = e.name,
                anilistId = e.anilistId,
                titleRomaji = e.titleRomaji,
                titleEnglish = e.titleEnglish,
                titleNative = e.titleNative,
                koreanTitle = e.koreanTitle,
                genres = e.genres,
                coverUrl = e.coverUrl,
                tmdbLogoUrl = e.tmdbLogoUrl,
                popularity = e.popularity,
                anilistSyncedAt = e.anilistSyncedAt,
            )
        }
}
