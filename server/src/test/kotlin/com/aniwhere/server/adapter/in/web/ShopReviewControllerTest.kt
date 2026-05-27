package com.aniwhere.server.adapter.`in`.web

import com.aniwhere.server.common.exception.EntityNotFoundException
import com.aniwhere.server.common.exception.GlobalExceptionHandler
import com.aniwhere.server.domain.shopreview.model.ShopReview
import com.aniwhere.server.domain.shopreview.model.ShopReviewStatus
import com.aniwhere.server.domain.shopreview.port.`in`.ShopReviewUseCase
import com.ninjasquad.springmockk.MockkBean
import io.mockk.every
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest
import org.springframework.context.annotation.Import
import org.springframework.data.domain.PageImpl
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.status
import java.time.LocalDateTime

@WebMvcTest(ShopReviewController::class)
@AutoConfigureMockMvc(addFilters = false)
@Import(GlobalExceptionHandler::class)
class ShopReviewControllerTest {

    @Autowired
    private lateinit var mvc: MockMvc

    @MockkBean
    private lateinit var useCase: ShopReviewUseCase

    private val sampleReview = ShopReview(
        id = 1L,
        shopId = 1L,
        authorUserId = 10L,
        authorNickname = "테스트유저",
        rating = 4,
        content = "좋은 샵이에요",
        status = ShopReviewStatus.VISIBLE,
        createdAt = LocalDateTime.now(),
    )

    @Test
    fun `GET shops_{shopId}_reviews - 페이지네이션된 리뷰 목록 조회`() {
        every { useCase.listReviews(1L, any()) } returns PageImpl(listOf(sampleReview))

        mvc.perform(get("/api/v1/shops/1/reviews"))
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.success").value(true))
            .andExpect(jsonPath("$.data.content[0].rating").value(4))
            .andExpect(jsonPath("$.data.content[0].authorNickname").value("테스트유저"))
    }

    @Test
    fun `GET shops_{shopId}_reviews - 샵이 없으면 404`() {
        every { useCase.listReviews(999L, any()) } throws EntityNotFoundException("Shop not found: 999")

        mvc.perform(get("/api/v1/shops/999/reviews"))
            .andExpect(status().isNotFound)
            .andExpect(jsonPath("$.success").value(false))
    }
}
