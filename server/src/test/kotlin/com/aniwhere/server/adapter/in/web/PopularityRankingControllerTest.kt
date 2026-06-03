package com.aniwhere.server.adapter.`in`.web

import com.aniwhere.server.domain.popularity.model.KeywordRankingItem
import com.aniwhere.server.domain.popularity.model.KeywordRankingResponse
import com.aniwhere.server.domain.popularity.model.MixedEntityRankingItem
import com.aniwhere.server.domain.popularity.model.MixedEntityRankingResponse
import com.aniwhere.server.domain.popularity.model.PopularityRankingKind
import com.aniwhere.server.domain.popularity.model.PopularityWindow
import com.aniwhere.server.domain.popularity.model.ShopRankingItem
import com.aniwhere.server.domain.popularity.model.ShopRankingResponse
import com.aniwhere.server.domain.popularity.model.WorkRankingItem
import com.aniwhere.server.domain.popularity.model.WorkRankingResponse
import com.aniwhere.server.domain.popularity.port.`in`.PopularityRankingUseCase
import com.ninjasquad.springmockk.MockkBean
import io.mockk.every
import io.mockk.verify
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.status

@WebMvcTest(PopularityRankingController::class)
@AutoConfigureMockMvc(addFilters = false)
class PopularityRankingControllerTest {

    @Autowired
    private lateinit var mvc: MockMvc

    @MockkBean
    private lateinit var useCase: PopularityRankingUseCase

    @Test
    fun `GET rankings_shops`() {
        every { useCase.shopRankings(PopularityWindow.D7, 20) } returns ShopRankingResponse(
            window = "7d",
            sampleSufficient = true,
            items = listOf(ShopRankingItem(rank = 1, shopId = 3L, label = "매장", score = 9.0, eventCount = 3)),
        )

        mvc.perform(get("/api/v1/rankings/shops"))
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.data.items[0].shopId").value(3))
            .andExpect(jsonPath("$.data.sampleSufficient").value(true))

        verify { useCase.shopRankings(PopularityWindow.D7, 20) }
    }

    @Test
    fun `GET rankings_search_keywords`() {
        every { useCase.keywordRankings(PopularityWindow.H24, 10) } returns KeywordRankingResponse(
            window = "24h",
            sampleSufficient = false,
            items = listOf(KeywordRankingItem(rank = 1, keyword = "원피스", score = 2.0, eventCount = 1)),
        )

        mvc.perform(get("/api/v1/rankings/search/keywords").param("window", "24h"))
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.data.items[0].keyword").value("원피스"))

        verify { useCase.keywordRankings(PopularityWindow.H24, 10) }
    }

    @Test
    fun `GET rankings_search_entities`() {
        every { useCase.mixedEntityRankings(PopularityWindow.D7, 10) } returns MixedEntityRankingResponse(
            window = "7d",
            sampleSufficient = true,
            items = listOf(
                MixedEntityRankingItem(
                    rank = 1,
                    kind = PopularityRankingKind.WORK,
                    workId = 7,
                    label = "주술회전",
                    score = 6.0,
                    eventCount = 2,
                ),
            ),
        )

        mvc.perform(get("/api/v1/rankings/search/entities"))
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.data.items[0].kind").value("WORK"))
            .andExpect(jsonPath("$.data.items[0].workId").value(7))
    }
}
