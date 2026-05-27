package com.aniwhere.server.domain.shopreview.service

import com.aniwhere.server.common.exception.BadRequestException
import com.aniwhere.server.common.exception.ForbiddenException
import com.aniwhere.server.domain.auth.port.out.AuthPersistencePort
import com.aniwhere.server.domain.shop.model.ImageUploadPart
import com.aniwhere.server.domain.shop.service.ShopServiceTest
import com.aniwhere.server.domain.shop.port.out.ShopImageStoragePort
import com.aniwhere.server.domain.shopreview.model.ShopRatingAggregate
import com.aniwhere.server.domain.shopreview.model.ShopReview
import com.aniwhere.server.domain.shopreview.model.ShopReviewStatus
import com.aniwhere.server.domain.shopreview.port.out.ShopReviewPersistencePort
import io.mockk.every
import io.mockk.impl.annotations.MockK
import io.mockk.junit5.MockKExtension
import io.mockk.mockk
import io.mockk.verify
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.assertThrows
import org.junit.jupiter.api.extension.ExtendWith
import org.springframework.transaction.PlatformTransactionManager
import org.springframework.transaction.support.SimpleTransactionStatus
import org.springframework.transaction.support.TransactionTemplate
import java.math.BigDecimal
import java.time.LocalDateTime

@ExtendWith(MockKExtension::class)
class ShopReviewServiceTest {

    @MockK
    private lateinit var port: ShopReviewPersistencePort

    @MockK
    private lateinit var authPersistence: AuthPersistencePort

    @MockK
    private lateinit var imageStorage: ShopImageStoragePort

    private lateinit var transactionTemplate: TransactionTemplate

    private lateinit var service: ShopReviewService

    private val sampleReview = ShopReview(
        id = 5L,
        shopId = 1L,
        authorUserId = 10L,
        authorNickname = "테스트",
        rating = 4,
        content = "좋아요",
        status = ShopReviewStatus.VISIBLE,
        createdAt = LocalDateTime.now(),
    )

    @BeforeEach
    fun setUp() {
        val tm = mockk<PlatformTransactionManager>()
        every { tm.getTransaction(any()) } returns SimpleTransactionStatus(true)
        every { tm.commit(any()) } returns Unit
        every { tm.rollback(any()) } returns Unit
        transactionTemplate = TransactionTemplate(tm)
        service = ShopReviewService(port, authPersistence, imageStorage, transactionTemplate)
        every { imageStorage.deleteObject(any()) } returns Unit
    }

    @Test
    fun `createReview - VISIBLE 리뷰 저장 후 shops 집계를 갱신한다`() {
        every { port.existsShop(1L) } returns true
        every { port.save(any()) } answers { firstArg<ShopReview>().copy(id = 5L) }
        every { port.recomputeShopRating(1L) } returns ShopRatingAggregate(BigDecimal("4.50"), 2)
        every { port.findByIdAndShopId(5L, 1L) } returns sampleReview.copy(rating = 5)

        val saved = service.createReview(
            authorUserId = 10L,
            shopId = 1L,
            rating = 5,
            content = "좋아요",
            imageParts = emptyList(),
        )

        assert(saved.rating == 5)
        verify { port.recomputeShopRating(1L) }
    }

    @Test
    fun `updateReviewStatus - HIDDEN으로 바꾸면 recomputeShopRating 호출`() {
        every { authPersistence.isAdmin(1L) } returns true
        every { port.updateStatus(5L, 1L, ShopReviewStatus.HIDDEN) } returns sampleReview.copy(status = ShopReviewStatus.HIDDEN)
        every { port.recomputeShopRating(1L) } returns ShopRatingAggregate(null, 0)

        service.updateReviewStatus(
            actorUserId = 1L,
            shopId = 1L,
            reviewId = 5L,
            status = ShopReviewStatus.HIDDEN,
        )

        verify { port.recomputeShopRating(1L) }
    }

    @Test
    fun `deleteReview - 작성자가 아니면 예외`() {
        every { port.findByIdAndShopId(5L, 1L) } returns sampleReview

        assertThrows<ForbiddenException> {
            service.deleteReview(actorUserId = 11L, shopId = 1L, reviewId = 5L)
        }
    }

    @Test
    fun `updateReview - 이미지 교체 시 기존 S3 키를 삭제하고 새 이미지를 저장한다`() {
        every { port.findByIdAndShopId(5L, 1L) } returnsMany listOf(
            sampleReview,
            sampleReview.copy(rating = 5, content = "수정"),
        )
        every { port.findReviewImageS3Keys(5L) } returns listOf("1/reviews/5/old.jpg")
        every { imageStorage.putObject(any(), any(), any()) } returns Unit
        every { port.update(5L, any()) } returns sampleReview.copy(rating = 5, content = "수정")
        every { port.replaceReviewImages(5L, any()) } returns Unit
        every { port.recomputeShopRating(1L) } returns ShopRatingAggregate(BigDecimal("4.50"), 1)
        val imagePart = ImageUploadPart(ShopServiceTest.tinyValidJpeg, "image/jpeg")

        service.updateReview(
            actorUserId = 10L,
            shopId = 1L,
            reviewId = 5L,
            rating = 5,
            content = "수정",
            imageParts = listOf(imagePart),
        )

        verify { imageStorage.deleteObject("1/reviews/5/old.jpg") }
        verify { port.replaceReviewImages(5L, any()) }
    }

    @Test
    fun `createReview - rating이 범위 밖이면 BadRequestException`() {
        every { port.existsShop(1L) } returns true

        assertThrows<BadRequestException> {
            service.createReview(
                authorUserId = 10L,
                shopId = 1L,
                rating = 0,
                content = "좋아요",
                imageParts = emptyList(),
            )
        }
    }

    @Test
    fun `createReview - 이미지가 5장을 초과하면 BadRequestException`() {
        every { port.existsShop(1L) } returns true
        val imageParts = List(6) { ImageUploadPart(byteArrayOf(1, 2, 3), "image/jpeg") }

        assertThrows<BadRequestException> {
            service.createReview(
                authorUserId = 10L,
                shopId = 1L,
                rating = 5,
                content = "좋아요",
                imageParts = imageParts,
            )
        }
    }
}
