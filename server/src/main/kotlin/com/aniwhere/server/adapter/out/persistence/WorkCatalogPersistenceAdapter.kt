package com.aniwhere.server.adapter.out.persistence

import com.aniwhere.server.adapter.out.persistence.entity.AnimationWorkEntity
import com.aniwhere.server.adapter.out.persistence.entity.GameWorkEntity
import com.aniwhere.server.adapter.out.persistence.entity.WorkEntity
import com.aniwhere.server.adapter.out.persistence.repository.AnimationWorkRepository
import com.aniwhere.server.adapter.out.persistence.repository.GameWorkRepository
import com.aniwhere.server.domain.work.model.WorkCatalogItem
import com.aniwhere.server.domain.work.model.WorkType
import com.aniwhere.server.domain.work.port.out.WorkCatalogPersistencePort
import org.springframework.stereotype.Component

@Component
class WorkCatalogPersistenceAdapter(
    private val animationRepo: AnimationWorkRepository,
    private val gameRepo: GameWorkRepository,
) : WorkCatalogPersistencePort {

    override fun findAllOrderedByPopularityDesc(type: WorkType?): List<WorkCatalogItem> =
        when (type) {
            WorkType.ANIMATION -> animationRepo.findAllOrderByPopularityDesc().map { toCatalogItem(it) }
            WorkType.GAME -> gameRepo.findAllOrderByNameAsc().map { toCatalogItem(it) }
            null -> findAllCombined()
        }

    private fun findAllCombined(): List<WorkCatalogItem> {
        val animations = animationRepo.findAllOrderByPopularityDesc().map { toCatalogItem(it) }
        val games = gameRepo.findAllOrderByNameAsc().map { toCatalogItem(it) }
        return animations + games
    }

    internal fun toCatalogItem(work: WorkEntity): WorkCatalogItem {
        val id = checkNotNull(work.id) { "work id absent" }
        return when (work) {
            is AnimationWorkEntity -> WorkCatalogItem(
                id = id,
                name = work.name,
                type = WorkType.ANIMATION,
                anilistId = work.anilistId,
                titleRomaji = work.titleRomaji,
                titleEnglish = work.titleEnglish,
                titleNative = work.titleNative,
                koreanTitle = work.koreanTitle,
                genres = work.genres,
                coverUrl = work.coverUrl,
                tmdbLogoUrl = work.tmdbLogoUrl,
                popularity = work.popularity,
                anilistSyncedAt = work.anilistSyncedAt,
            )
            is GameWorkEntity -> WorkCatalogItem(
                id = id,
                name = work.name,
                type = WorkType.GAME,
                coverUrl = work.coverUrl,
            )
            else -> error("Unknown work subtype: ${work::class.simpleName}")
        }
    }
}
