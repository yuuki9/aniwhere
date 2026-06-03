package com.aniwhere.server.domain.popularity.service

import com.aniwhere.server.domain.popularity.model.PopularityWindow
import com.aniwhere.server.domain.popularity.port.out.PopularityEntityScoreRow
import com.aniwhere.server.domain.popularity.port.out.PopularityPersistencePort
import com.aniwhere.server.domain.popularity.port.out.PopularityStaticShopRow
import com.aniwhere.server.domain.popularity.port.out.PopularityStaticWorkRow
import io.mockk.every
import io.mockk.mockk
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertFalse
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Test

class PopularityRankingServiceTest {

    private val port = mockk<PopularityPersistencePort>()
    private val service = PopularityRankingService(port)

    @Test
    fun `shopRankings - returns event driven ranking when sample sufficient`() {
        every { port.aggregateShopScores(any(), 10) } returns listOf(
            PopularityEntityScoreRow(shopId = 3L, score = 9.0, eventCount = 50),
        )
        every { port.findShopLabels(listOf(3L)) } returns mapOf(3L to "테스트 매장")
        every { port.findTopShopsByStaticSignals(any()) } returns emptyList()

        val result = service.shopRankings(PopularityWindow.D7, limit = 10)

        assertTrue(result.sampleSufficient)
        assertEquals("7d", result.window)
        assertEquals(1, result.items.size)
        assertEquals(3L, result.items[0].shopId)
        assertEquals("테스트 매장", result.items[0].label)
        assertEquals(9.0, result.items[0].score)
    }

    @Test
    fun `keywordRankings - marks sample insufficient below threshold`() {
        every { port.aggregateKeywordScores(any(), 10) } returns listOf(
            PopularityEntityScoreRow(keyword = "원피스", score = 2.0, eventCount = 1),
        )

        val result = service.keywordRankings(PopularityWindow.D7, limit = 10)

        assertFalse(result.sampleSufficient)
        assertEquals("원피스", result.items[0].keyword)
    }

    @Test
    fun `mixedEntityRankings - merges shop and work by score`() {
        every { port.aggregateShopScores(any(), 5) } returns listOf(
            PopularityEntityScoreRow(shopId = 1L, score = 5.0, eventCount = 50),
        )
        every { port.aggregateWorkScores(any(), 5) } returns listOf(
            PopularityEntityScoreRow(workId = 9, score = 8.0, eventCount = 50),
        )
        every { port.findShopLabels(listOf(1L)) } returns mapOf(1L to "매장A")
        every { port.findWorkLabels(listOf(9)) } returns mapOf(9 to "작품B")
        every { port.findTopShopsByStaticSignals(any()) } returns emptyList()
        every { port.findTopWorksByPopularity(any()) } returns emptyList()

        val result = service.mixedEntityRankings(PopularityWindow.H24, limit = 5)

        assertEquals("24h", result.window)
        assertEquals(2, result.items.size)
        assertEquals(9, result.items[0].workId)
        assertEquals(1L, result.items[1].shopId)
    }

    @Test
    fun `shopRankings - blends static shops when sample insufficient`() {
        every { port.aggregateShopScores(any(), 5) } returns emptyList()
        every { port.findTopShopsByStaticSignals(5) } returns listOf(
            PopularityStaticShopRow(shopId = 7L, label = "정적 매장", reviewCount = 10, favoriteCount = 4),
        )
        every { port.findShopLabels(listOf(7L)) } returns mapOf(7L to "정적 매장")

        val result = service.shopRankings(PopularityWindow.D7, limit = 5)

        assertFalse(result.sampleSufficient)
        assertEquals(7L, result.items[0].shopId)
        assertEquals(0, result.items[0].eventCount)
    }
}
