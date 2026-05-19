package com.aniwhere.server.adapter.out.persistence

import com.aniwhere.server.adapter.out.persistence.entity.AnimationWorkEntity
import com.aniwhere.server.adapter.out.persistence.entity.GameWorkEntity
import com.aniwhere.server.domain.work.model.WorkType
import io.mockk.every
import io.mockk.mockk
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test

class WorkCatalogPersistenceAdapterTest {

    private val adapter = WorkCatalogPersistenceAdapter(
        animationRepo = mockk(relaxed = true),
        gameRepo = mockk(relaxed = true),
    )

    @Test
    fun `AnimationWorkEntity 는 ANIMATION 타입으로 매핑한다`() {
        val entity = mockk<AnimationWorkEntity> {
            every { id } returns 1
            every { name } returns "원피스"
            every { popularity } returns 10
            every { anilistId } returns 1L
            every { titleRomaji } returns null
            every { titleEnglish } returns null
            every { titleNative } returns null
            every { koreanTitle } returns null
            every { genres } returns null
            every { coverUrl } returns null
            every { tmdbLogoUrl } returns null
            every { anilistSyncedAt } returns null
        }

        val item = adapter.toCatalogItem(entity)

        assertThat(item.type).isEqualTo(WorkType.ANIMATION)
        assertThat(item.popularity).isEqualTo(10)
        assertThat(item.anilistId).isEqualTo(1L)
    }

    @Test
    fun `GameWorkEntity 는 GAME 타입으로 매핑하고 AniList 필드는 null 이다`() {
        val entity = mockk<GameWorkEntity> {
            every { id } returns 2
            every { name } returns "젤다"
            every { coverUrl } returns null
        }

        val item = adapter.toCatalogItem(entity)

        assertThat(item.type).isEqualTo(WorkType.GAME)
        assertThat(item.anilistId).isNull()
        assertThat(item.popularity).isNull()
    }
}
