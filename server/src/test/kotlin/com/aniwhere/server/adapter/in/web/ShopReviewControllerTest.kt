package com.aniwhere.server.adapter.`in`.web

import com.aniwhere.server.common.exception.EntityNotFoundException
import com.aniwhere.server.common.exception.ForbiddenException
import com.aniwhere.server.common.exception.GlobalExceptionHandler
import com.aniwhere.server.config.security.SecurityPrincipal
import com.aniwhere.server.domain.shop.model.ImageUploadPart
import com.aniwhere.server.domain.shopreview.model.ShopReview
import com.aniwhere.server.domain.shopreview.model.ShopReviewStatus
import com.aniwhere.server.domain.shopreview.port.`in`.ShopReviewUseCase
import com.ninjasquad.springmockk.MockkBean
import io.mockk.every
import io.mockk.verify
import org.junit.jupiter.api.AfterEach
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest
import org.springframework.context.annotation.Import
import org.springframework.data.domain.PageImpl
import org.springframework.mock.web.MockMultipartFile
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken
import org.springframework.security.core.authority.SimpleGrantedAuthority
import org.springframework.security.core.context.SecurityContextHolder
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart
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

    @AfterEach
    fun tearDown() {
        SecurityContextHolder.clearContext()
    }

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

    @Test
    fun `POST shop review - rating 없으면 400`() {
        mockAuthenticatedUser(10L)

        mvc.perform(
            multipart("/api/v1/shops/1/reviews")
                .param("content", "본문"),
        ).andExpect(status().isBadRequest)
    }

    @Test
    fun `POST shop review - rating content images를 useCase로 전달`() {
        mockAuthenticatedUser(10L)
        every { useCase.createReview(10L, 1L, 5, "좋았어요", any()) } returns sampleReview.copy(rating = 5, content = "좋았어요")
        val image = MockMultipartFile("images", "a.jpg", "image/jpeg", byteArrayOf(1, 2, 3))

        mvc.perform(
            multipart("/api/v1/shops/1/reviews")
                .file(image)
                .param("rating", "5")
                .param("content", "  좋았어요  "),
        )
            .andExpect(status().isCreated)
            .andExpect(jsonPath("$.success").value(true))
            .andExpect(jsonPath("$.data.rating").value(5))

        verify {
            useCase.createReview(
                10L,
                1L,
                5,
                "좋았어요",
                match { parts ->
                    parts.size == 1 &&
                        parts[0].contentType == "image/jpeg" &&
                        parts[0].bytes.contentEquals(byteArrayOf(1, 2, 3))
                },
            )
        }
    }

    @Test
    fun `DELETE shop review - 작성자가 아니면 403`() {
        mockAuthenticatedUser(11L)
        every { useCase.deleteReview(11L, 1L, 5L) } throws ForbiddenException("Only the author can modify this review")

        mvc.perform(delete("/api/v1/shops/1/reviews/5"))
            .andExpect(status().isForbidden)
            .andExpect(jsonPath("$.success").value(false))
    }

    @Test
    fun `DELETE shop review - 작성자면 200`() {
        mockAuthenticatedUser(10L)
        every { useCase.deleteReview(10L, 1L, 5L) } returns Unit

        mvc.perform(delete("/api/v1/shops/1/reviews/5"))
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.success").value(true))

        verify { useCase.deleteReview(10L, 1L, 5L) }
    }

    @Test
    fun `PATCH shop review - rating content images를 useCase로 전달`() {
        mockAuthenticatedUser(10L)
        every {
            useCase.updateReview(10L, 1L, 5L, 5, "수정본문", any())
        } returns sampleReview.copy(rating = 5, content = "수정본문")
        val image = MockMultipartFile("images", "a.jpg", "image/jpeg", byteArrayOf(1, 2, 3))

        mvc.perform(
            multipart("/api/v1/shops/1/reviews/5")
                .file(image)
                .param("rating", "5")
                .param("content", "  수정본문  ")
                .with { request ->
                    request.method = "PATCH"
                    request
                },
        )
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.success").value(true))
            .andExpect(jsonPath("$.data.rating").value(5))

        verify {
            useCase.updateReview(
                10L,
                1L,
                5L,
                5,
                "수정본문",
                match { parts ->
                    parts.size == 1 &&
                        parts[0].contentType == "image/jpeg" &&
                        parts[0].bytes.contentEquals(byteArrayOf(1, 2, 3))
                },
            )
        }
    }

    private fun mockAuthenticatedUser(userId: Long) {
        val principal = SecurityPrincipal(userId = userId, role = "ROLE_USER")
        val auth = UsernamePasswordAuthenticationToken(principal, null, listOf(SimpleGrantedAuthority("ROLE_USER")))
        SecurityContextHolder.getContext().authentication = auth
    }
}
