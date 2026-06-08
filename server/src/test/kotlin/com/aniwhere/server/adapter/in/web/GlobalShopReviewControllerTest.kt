package com.aniwhere.server.adapter.`in`.web

import com.aniwhere.server.domain.shopreview.model.RecentShopReview
import com.aniwhere.server.domain.shopreview.model.ShopReviewStatus
import com.aniwhere.server.domain.shopreview.port.`in`.ShopReviewUseCase
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
import java.time.LocalDateTime

@WebMvcTest(GlobalShopReviewController::class)
@AutoConfigureMockMvc(addFilters = false)
class GlobalShopReviewControllerTest {

    @Autowired
    private lateinit var mvc: MockMvc

    @MockkBean
    private lateinit var useCase: ShopReviewUseCase

    private val sampleReview = RecentShopReview(
        shopName = "애니메이트 홍대",
        id = 1L,
        shopId = 3L,
        authorUserId = 10L,
        authorNickname = "테스트유저",
        rating = 4,
        content = "좋은 샵이에요",
        createdAt = LocalDateTime.now(),
    )

    @Test
    fun `GET reviews_recent - 기본 limit 10으로 최근 리뷰를 조회한다`() {
        every { useCase.listRecentReviews(10, null) } returns listOf(sampleReview)

        mvc.perform(get("/api/v1/reviews/recent"))
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.success").value(true))
            .andExpect(jsonPath("$.data[0].shopId").value(3))
            .andExpect(jsonPath("$.data[0].shopName").value("애니메이트 홍대"))
            .andExpect(jsonPath("$.data[0].rating").value(4))
            .andExpect(jsonPath("$.data[0].authorNickname").value("테스트유저"))

        verify { useCase.listRecentReviews(10, null) }
    }

    @Test
    fun `GET reviews_recent - limit 파라미터를 useCase로 전달한다`() {
        every { useCase.listRecentReviews(5, null) } returns emptyList()

        mvc.perform(get("/api/v1/reviews/recent").param("limit", "5"))
            .andExpect(status().isOk)

        verify { useCase.listRecentReviews(5, null) }
    }
}
