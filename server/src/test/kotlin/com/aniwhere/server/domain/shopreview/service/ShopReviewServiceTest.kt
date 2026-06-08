package com.aniwhere.server.domain.shopreview.service

import com.aniwhere.server.common.exception.BadRequestException
import com.aniwhere.server.common.exception.ForbiddenException
import com.aniwhere.server.domain.auth.port.out.AuthPersistencePort
import com.aniwhere.server.domain.shop.model.ImageUploadPart
import com.aniwhere.server.domain.shop.service.ShopServiceTest
import com.aniwhere.server.domain.shopreview.port.out.ReviewImageStoragePort
import com.aniwhere.server.domain.shopreview.model.ShopRatingAggregate
import com.aniwhere.server.domain.shopreview.model.ShopReview
import com.aniwhere.server.domain.shopreview.model.ShopReviewImage
import com.aniwhere.server.domain.shopreview.model.ShopReviewSort
import com.aniwhere.server.domain.shopreview.model.ShopReviewStatus
import com.aniwhere.server.domain.shopreview.port.out.ShopReviewPersistencePort
import io.mockk.every
import io.mockk.impl.annotations.MockK
import io.mockk.junit5.MockKExtension
import io.mockk.mockk
import io.mockk.verify
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.assertThrows
import org.junit.jupiter.api.extension.ExtendWith
import org.springframework.data.domain.PageImpl
import org.springframework.data.domain.PageRequest
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
    private lateinit var imageStorage: ReviewImageStoragePort

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

        assertEquals(5, saved.rating)
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
    fun `updateReview - replaceImages로 images만 보내면 기존 이미지를 전부 교체한다`() {
        every { port.findByIdAndShopId(5L, 1L) } returnsMany listOf(
            sampleReview,
            sampleReview.copy(rating = 5, content = "수정"),
        )
        every { imageStorage.putObject(any(), any(), any()) } returns Unit
        every { port.update(5L, any()) } returns sampleReview.copy(rating = 5, content = "수정")
        every { port.swapReviewImages(5L, any(), emptyList()) } returns listOf("img/review/5/gallery-1.jpg")
        every { port.recomputeShopRating(1L) } returns ShopRatingAggregate(BigDecimal("4.50"), 1)
        val imagePart = ImageUploadPart(ShopServiceTest.tinyValidJpeg, "image/jpeg")

        service.updateReview(
            actorUserId = 10L,
            shopId = 1L,
            reviewId = 5L,
            rating = 5,
            content = "수정",
            replaceImages = true,
            imageParts = listOf(imagePart),
            existingImageIds = emptyList(),
        )

        verify { imageStorage.deleteObject("img/review/5/gallery-1.jpg") }
        verify { port.swapReviewImages(5L, any(), emptyList()) }
    }

    @Test
    fun `updateReview - replaceImages로 existingImageIds만 보내면 재정렬 또는 일부 삭제한다`() {
        val reviewWithImages = sampleReview.copy(
            images = listOf(
                ShopReviewImage(id = 1L, url = "/img/1.jpg", sortOrder = 0),
                ShopReviewImage(id = 2L, url = "/img/2.jpg", sortOrder = 1),
                ShopReviewImage(id = 3L, url = "/img/3.jpg", sortOrder = 2),
            ),
        )
        every { port.findByIdAndShopId(5L, 1L) } returnsMany listOf(reviewWithImages, reviewWithImages)
        every { port.update(5L, any()) } returns reviewWithImages
        every { port.swapReviewImages(5L, emptyList(), listOf(1L, 3L)) } returns listOf("img/review/5/gallery-2.jpg")
        every { port.recomputeShopRating(1L) } returns ShopRatingAggregate(BigDecimal("4.50"), 1)

        service.updateReview(
            actorUserId = 10L,
            shopId = 1L,
            reviewId = 5L,
            rating = null,
            content = null,
            replaceImages = true,
            imageParts = emptyList(),
            existingImageIds = listOf(1L, 3L),
        )

        verify { port.swapReviewImages(5L, emptyList(), listOf(1L, 3L)) }
        verify { imageStorage.deleteObject("img/review/5/gallery-2.jpg") }
    }

    @Test
    fun `updateReview - replaceImages false 인데 images가 있으면 거절`() {
        every { port.findByIdAndShopId(5L, 1L) } returns sampleReview
        val imagePart = ImageUploadPart(ShopServiceTest.tinyValidJpeg, "image/jpeg")

        assertThrows<BadRequestException> {
            service.updateReview(
                actorUserId = 10L,
                shopId = 1L,
                reviewId = 5L,
                rating = 5,
                content = "수정",
                replaceImages = false,
                imageParts = listOf(imagePart),
                existingImageIds = emptyList(),
            )
        }
    }

    @Test
    fun `updateReview - 잘못된 existingImageIds면 거절`() {
        every { port.findByIdAndShopId(5L, 1L) } returns sampleReview.copy(
            images = listOf(
                ShopReviewImage(id = 1L, url = "/img/1.jpg", sortOrder = 0),
            ),
        )

        assertThrows<BadRequestException> {
            service.updateReview(
                actorUserId = 10L,
                shopId = 1L,
                reviewId = 5L,
                rating = null,
                content = null,
                replaceImages = true,
                imageParts = emptyList(),
                existingImageIds = listOf(99L),
            )
        }
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

    @Test
    fun `likeReview - VISIBLE 리뷰에 좋아요를 저장한다`() {
        every { port.existsShop(1L) } returns true
        every { port.findVisibleByIdAndShopId(5L, 1L) } returns sampleReview
        every { port.saveReviewLike(5L, 10L) } returns Unit

        service.likeReview(userId = 10L, shopId = 1L, reviewId = 5L)

        verify { port.saveReviewLike(5L, 10L) }
    }

    @Test
    fun `unlikeReview - 좋아요를 삭제한다`() {
        every { port.existsShop(1L) } returns true
        every { port.findVisibleByIdAndShopId(5L, 1L) } returns sampleReview
        every { port.deleteReviewLike(5L, 10L) } returns Unit

        service.unlikeReview(userId = 10L, shopId = 1L, reviewId = 5L)

        verify { port.deleteReviewLike(5L, 10L) }
    }

    @Test
    fun `listReviews - viewerUserId가 있으면 likedByMe를 채운다`() {
        every { port.existsShop(1L) } returns true
        every { port.findVisibleByShopId(1L, any()) } returns PageImpl(
            listOf(sampleReview.copy(id = 5L), sampleReview.copy(id = 6L)),
        )
        every { port.findLikedReviewIds(10L, listOf(5L, 6L)) } returns setOf(5L)

        val page = service.listReviews(1L, ShopReviewSort.NEWEST, PageRequest.of(0, 20), 10L)

        assertEquals(true, page.content[0].likedByMe)
        assertEquals(false, page.content[1].likedByMe)
    }

    @Test
    fun `listRecentReviews - 최근 VISIBLE 리뷰를 limit만큼 조회한다`() {
        every { port.findRecentVisible(10) } returns listOf(
            sampleReview.copy(id = 5L, shopId = 1L),
            sampleReview.copy(id = 4L, shopId = 2L),
        )
        every { port.findShopNamesByIds(listOf(1L, 2L)) } returns mapOf(
            1L to "애니메이트 홍대",
            2L to "굿즈샵 강남",
        )

        val reviews = service.listRecentReviews(10, null)

        assertEquals(2, reviews.size)
        assertEquals("애니메이트 홍대", reviews[0].shopName)
        assertEquals("굿즈샵 강남", reviews[1].shopName)
        verify { port.findRecentVisible(10) }
    }

    @Test
    fun `listRecentReviews - limit를 허용 범위로 보정한다`() {
        every { port.findRecentVisible(50) } returns emptyList()
        every { port.findShopNamesByIds(emptyList()) } returns emptyMap()

        service.listRecentReviews(999, null)

        verify { port.findRecentVisible(50) }
    }

    @Test
    fun `listRecentReviews - viewerUserId가 있으면 likedByMe를 채운다`() {
        every { port.findRecentVisible(10) } returns listOf(
            sampleReview.copy(id = 5L),
            sampleReview.copy(id = 6L),
        )
        every { port.findLikedReviewIds(10L, listOf(5L, 6L)) } returns setOf(5L)
        every { port.findShopNamesByIds(listOf(1L)) } returns mapOf(1L to "애니메이트 홍대")

        val reviews = service.listRecentReviews(10, 10L)

        assertEquals(true, reviews[0].likedByMe)
        assertEquals(false, reviews[1].likedByMe)
        assertEquals("애니메이트 홍대", reviews[0].shopName)
    }

    @Test
    fun `listMyReviews - 내 리뷰 목록을 조회하고 likedByMe를 채운다`() {
        every { port.existsUser(10L) } returns true
        every { port.findByAuthorUserIdExcludingDeleted(10L, any()) } returns PageImpl(
            listOf(sampleReview.copy(id = 5L)),
        )
        every { port.findLikedReviewIds(10L, listOf(5L)) } returns setOf(5L)

        val page = service.listMyReviews(10L, ShopReviewSort.NEWEST, PageRequest.of(0, 20))

        assertEquals(1, page.content.size)
        assertEquals(true, page.content[0].likedByMe)
    }
}
