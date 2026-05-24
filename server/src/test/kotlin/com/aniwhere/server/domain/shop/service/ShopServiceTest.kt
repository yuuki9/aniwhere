package com.aniwhere.server.domain.shop.service

import com.aniwhere.server.common.exception.BadRequestException
import com.aniwhere.server.common.exception.EntityNotFoundException
import com.aniwhere.server.domain.shop.model.ImageUploadPart
import com.aniwhere.server.domain.shop.model.Shop
import com.aniwhere.server.domain.shop.model.ShopFacetResponse
import com.aniwhere.server.domain.shop.model.ShopImageRole
import com.aniwhere.server.domain.shop.model.ShopStatus
import com.aniwhere.server.domain.shop.port.out.ShopImagePersistenceRow
import com.aniwhere.server.domain.shop.port.out.ShopImageStoragePort
import com.aniwhere.server.domain.shop.port.out.ShopPersistencePort
import io.mockk.every
import io.mockk.impl.annotations.MockK
import io.mockk.junit5.MockKExtension
import io.mockk.mockk
import io.mockk.slot
import io.mockk.verify
import io.mockk.verifyOrder
import org.junit.jupiter.api.Assertions.*
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.assertThrows
import org.junit.jupiter.api.extension.ExtendWith
import org.springframework.data.domain.PageImpl
import org.springframework.data.domain.PageRequest
import org.springframework.transaction.PlatformTransactionManager
import org.springframework.transaction.support.SimpleTransactionStatus
import org.springframework.transaction.support.TransactionTemplate
import java.awt.image.BufferedImage
import java.io.ByteArrayOutputStream
import java.math.BigDecimal
import javax.imageio.ImageIO

@ExtendWith(MockKExtension::class)
class ShopServiceTest {

    @MockK
    private lateinit var port: ShopPersistencePort

    @MockK
    private lateinit var imageStorage: ShopImageStoragePort

    private lateinit var transactionTemplate: TransactionTemplate

    private lateinit var service: ShopService

    private val sampleShop = Shop(
        id = 1L, name = "테스트샵", address = "서울시 강남구",
        px = BigDecimal("127.0276368"), py = BigDecimal("37.4979462"),
        status = ShopStatus.ACTIVE,
    )

    @BeforeEach
    fun setup() {
        val tm = mockk<PlatformTransactionManager>()
        every { tm.getTransaction(any()) } returns SimpleTransactionStatus(true)
        every { tm.commit(any()) } returns Unit
        every { tm.rollback(any()) } returns Unit
        transactionTemplate = TransactionTemplate(tm)
        service = ShopService(port, imageStorage, transactionTemplate)
        every { imageStorage.deleteObject(any()) } returns Unit
    }

    @Test
    fun `getShop - 존재하는 샵 조회 성공`() {
        every { port.findById(1L) } returns sampleShop
        assertEquals("테스트샵", service.getShop(1L).name)
    }

    @Test
    fun `getShop - 존재하지 않는 샵 조회시 예외`() {
        every { port.findById(999L) } returns null
        assertThrows<EntityNotFoundException> { service.getShop(999L) }
    }

    @Test
    fun `searchShops - 페이징 검색`() {
        val pageable = PageRequest.of(0, 20)
        every { port.findAll(any(), any(), any(), any(), any(), any(), any(), pageable) } returns PageImpl(listOf(sampleShop))
        val result = service.searchShops(
            regionId = 1,
            categoryName = null,
            categoryIds = emptySet(),
            keyword = "테스트",
            workKeyword = null,
            workId = null,
            status = ShopStatus.ACTIVE,
            pageable = pageable,
        )
        assertEquals(1, result.totalElements)
        verify { port.findAll(1, null, emptySet(), "테스트", null, null, ShopStatus.ACTIVE, pageable) }
    }

    @Test
    fun `createShop - 샵 생성 성공`() {
        every { port.save(any()) } returns sampleShop
        assertNotNull(service.createShop(sampleShop.copy(id = null)).id)
    }

    @Test
    fun `getShopFacets - 옵션 목록을 persistence port에서 조회한다`() {
        val expected = ShopFacetResponse()
        every { port.findFacets(true, false, true) } returns expected

        val result = service.getShopFacets(includeRegions = true, includeCategories = false, includeWorkTypes = true)

        assertSame(expected, result)
        verify(exactly = 1) { port.findFacets(true, false, true) }
    }

    @Test
    fun `createShopWithImages - S3 키와 DB 이미지 행이 순서대로 저장됨`() {
        val created = sampleShop.copy(id = null)
        val putKeys = mutableListOf<String>()
        var savedRows: List<ShopImagePersistenceRow>? = null
        every { port.save(any()) } returns sampleShop
        every { imageStorage.putObject(any(), any(), any()) } answers {
            putKeys.add(firstArg())
        }
        every { port.saveShopImageRecords(1L, any()) } answers {
            savedRows = secondArg()
        }
        every { port.findById(1L) } returns sampleShop
        val cover = ImageUploadPart(tinyValidJpeg, "image/jpeg")
        val gallery = listOf(ImageUploadPart(minimalPngBytes, "image/png"))
        val result = service.createShopWithImages(created, cover, gallery)
        assertEquals(1L, result.id)
        assertEquals(
            listOf("1/primary.jpg", "1/gallery-1.png"),
            putKeys,
        )
        val rows = savedRows!!
        assertEquals(2, rows.size)
        assertEquals(
            ShopImagePersistenceRow("1/primary.jpg", ShopImageRole.PRIMARY, 0),
            rows[0],
        )
        assertEquals(
            ShopImagePersistenceRow("1/gallery-1.png", ShopImageRole.GALLERY, 1),
            rows[1],
        )
        verify(exactly = 2) { imageStorage.putObject(any(), any(), any()) }
        verify { port.saveShopImageRecords(1L, any()) }
        verify(exactly = 0) { imageStorage.deleteObject(any()) }
        verify(exactly = 0) { port.deleteById(any()) }
    }

    @Test
    fun `createShopWithImages - 잘못된 이미지 바이트는 저장 전에 거절`() {
        assertThrows<BadRequestException> {
            service.createShopWithImages(
                sampleShop.copy(id = null),
                ImageUploadPart(byteArrayOf(1, 2, 3), "image/jpeg"),
                emptyList(),
            )
        }
        verify(exactly = 0) { port.save(any()) }
        verify(exactly = 0) { imageStorage.putObject(any(), any(), any()) }
    }

    @Test
    fun `createShopWithImages - 이미지 메타 저장 실패 시 S3 객체와 선저장 상점을 보상 삭제한다`() {
        val created = sampleShop.copy(id = null)
        every { port.save(any()) } returns sampleShop
        every { imageStorage.putObject(any(), any(), any()) } returns Unit
        every { port.saveShopImageRecords(1L, any()) } throws RuntimeException("db error")
        every { port.deleteById(1L) } returns Unit

        assertThrows<RuntimeException> {
            service.createShopWithImages(
                created,
                ImageUploadPart(tinyValidJpeg, "image/jpeg"),
                listOf(ImageUploadPart(minimalPngBytes, "image/png")),
            )
        }

        verifyOrder {
            imageStorage.putObject("1/primary.jpg", any(), any())
            imageStorage.putObject("1/gallery-1.png", any(), any())
            port.saveShopImageRecords(1L, any())
            imageStorage.deleteObject("1/primary.jpg")
            imageStorage.deleteObject("1/gallery-1.png")
            port.deleteById(1L)
        }
    }

    @Test
    fun `createShopWithImages - 갤러리 업로드 실패 시 이미 업로드된 객체와 상점 레코드를 정리한다`() {
        val created = sampleShop.copy(id = null)
        every { port.save(any()) } returns sampleShop
        every { imageStorage.putObject("1/primary.jpg", any(), any()) } returns Unit
        every { imageStorage.putObject("1/gallery-1.png", any(), any()) } throws RuntimeException("s3 down")
        every { port.deleteById(1L) } returns Unit

        assertThrows<RuntimeException> {
            service.createShopWithImages(
                created,
                ImageUploadPart(tinyValidJpeg, "image/jpeg"),
                listOf(ImageUploadPart(minimalPngBytes, "image/png")),
            )
        }

        verifyOrder {
            imageStorage.putObject("1/primary.jpg", any(), any())
            imageStorage.putObject("1/gallery-1.png", any(), any())
            imageStorage.deleteObject("1/primary.jpg")
            port.deleteById(1L)
        }
        verify(exactly = 0) { port.saveShopImageRecords(any(), any()) }
    }

    @Test
    fun `createShopWithImages - 커버 업로드 직후 실패하면 S3 삭제 없이 상점만 보상 삭제한다`() {
        val created = sampleShop.copy(id = null)
        every { port.save(any()) } returns sampleShop
        every { imageStorage.putObject("1/primary.jpg", any(), any()) } throws RuntimeException("s3 network")
        every { port.deleteById(1L) } returns Unit

        assertThrows<RuntimeException> {
            service.createShopWithImages(
                created,
                ImageUploadPart(tinyValidJpeg, "image/jpeg"),
                emptyList(),
            )
        }

        verify(exactly = 0) { imageStorage.deleteObject(any()) }
        verify(exactly = 0) { port.saveShopImageRecords(any(), any()) }
        verify { port.deleteById(1L) }
    }

    @Test
    fun `createShopWithImages - 보상 단계 중 S3 deleteObject 실패해도 나머지 정리 시도 원 예외 유지`() {
        val created = sampleShop.copy(id = null)
        every { port.save(any()) } returns sampleShop
        every { imageStorage.putObject(any(), any(), any()) } returns Unit
        every { port.saveShopImageRecords(1L, any()) } throws RuntimeException("db error")
        every { imageStorage.deleteObject("1/primary.jpg") } throws RuntimeException("s3 delete primary fail")
        every { imageStorage.deleteObject("1/gallery-1.png") } returns Unit
        every { port.deleteById(1L) } returns Unit

        val ex = assertThrows<RuntimeException> {
            service.createShopWithImages(
                created,
                ImageUploadPart(tinyValidJpeg, "image/jpeg"),
                listOf(ImageUploadPart(minimalPngBytes, "image/png")),
            )
        }

        assertEquals("db error", ex.message)
        assertTrue(ex.suppressed.any { it.message == "s3 delete primary fail" })
        verifyOrder {
            imageStorage.deleteObject("1/primary.jpg")
            imageStorage.deleteObject("1/gallery-1.png")
            port.deleteById(1L)
        }
    }

    @Test
    fun `createShopWithImages - 보상 상점 삭제 실패 시 suppress 되고 원 업로드 실패 원인 유지`() {
        val created = sampleShop.copy(id = null)
        every { port.save(any()) } returns sampleShop
        every { imageStorage.putObject(any(), any(), any()) } returns Unit
        every { port.saveShopImageRecords(1L, any()) } throws RuntimeException("db error")
        every { imageStorage.deleteObject(any()) } returns Unit
        every { port.deleteById(1L) } throws RuntimeException("delete shop fail")

        val ex = assertThrows<RuntimeException> {
            service.createShopWithImages(
                created,
                ImageUploadPart(tinyValidJpeg, "image/jpeg"),
                listOf(ImageUploadPart(minimalPngBytes, "image/png")),
            )
        }

        assertEquals("db error", ex.message)
        assertTrue(ex.suppressed.any { it.message == "delete shop fail" })
        verify { port.deleteById(1L) }
    }

    @Test
    fun `updateShop - 샵 수정 성공`() {
        val updated = sampleShop.copy(name = "수정된샵")
        every { port.update(1L, any()) } returns updated
        assertEquals("수정된샵", service.updateShop(1L, updated).name)
    }

    @Test
    fun `updateShopWithImages - 대표 이미지 검증 실패 시 메타·이미지 DB 모두 미반영`() {
        every { port.findById(1L) } returns sampleShop
        val incoming = sampleShop.copy(name = "실패해야함")
        assertThrows<BadRequestException> {
            service.updateShopWithImages(
                1L,
                incoming,
                ImageUploadPart(byteArrayOf(1, 2, 3), "image/jpeg"),
                replaceGallery = false,
                gallery = emptyList(),
                existingGalleryImageIds = emptyList(),
            )
        }
        verify(exactly = 0) { port.update(any(), any()) }
        verify(exactly = 0) { port.swapShopImageRecords(any(), any(), any(), any()) }
    }

    @Test
    fun `updateShopWithImages - replaceGallery 에 갤러리 바이트 실패 시 update 미호출`() {
        every { port.findById(1L) } returns sampleShop
        assertThrows<BadRequestException> {
            service.updateShopWithImages(
                1L,
                sampleShop,
                coverImage = null,
                replaceGallery = true,
                gallery = listOf(ImageUploadPart(byteArrayOf(9, 9), "image/png")),
                existingGalleryImageIds = emptyList(),
            )
        }
        verify(exactly = 0) { port.update(any(), any()) }
        verify(exactly = 0) { imageStorage.putObject(any(), any(), any()) }
    }

    @Test
    fun `updateShopWithImages - replaceGallery false 인데 gallery 가 있으면 거절`() {
        every { port.findById(1L) } returns sampleShop
        assertThrows<BadRequestException> {
            service.updateShopWithImages(
                1L,
                sampleShop,
                coverImage = null,
                replaceGallery = false,
                gallery = listOf(ImageUploadPart(minimalPngBytes, "image/png")),
                existingGalleryImageIds = emptyList(),
            )
        }
        verify(exactly = 0) { port.update(any(), any()) }
        verify(exactly = 0) { imageStorage.putObject(any(), any(), any()) }
    }

    @Test
    fun `updateShopWithImages - replaceGallery false 인데 대표와 gallery 동시 전송 시 거절하고 업로드 없음`() {
        every { port.findById(1L) } returns sampleShop
        assertThrows<BadRequestException> {
            service.updateShopWithImages(
                1L,
                sampleShop,
                ImageUploadPart(tinyValidJpeg, "image/jpeg"),
                replaceGallery = false,
                gallery = listOf(ImageUploadPart(minimalPngBytes, "image/png")),
                existingGalleryImageIds = emptyList(),
            )
        }
        verify(exactly = 0) { port.update(any(), any()) }
        verify(exactly = 0) { imageStorage.putObject(any(), any(), any()) }
    }

    @Test
    fun `updateShopWithImages - 메타만 갱신하고 이미지 경로 미호출`() {
        every { port.findById(1L) } returns sampleShop
        every { port.update(1L, any()) } returns sampleShop
        val incoming = sampleShop.copy(name = "갱신된이름")

        assertEquals(sampleShop.name, service.updateShopWithImages(1L, incoming, null, false, emptyList(), emptyList()).name)

        verify { port.update(1L, incoming) }
        verify(exactly = 0) { imageStorage.putObject(any(), any(), any()) }
        verify(exactly = 0) { port.swapShopImageRecords(any(), any(), any(), any()) }
    }

    @Test
    fun `updateShopWithImages - 대표 교체 시 UUID 키로 업로드하고 예전 고정 키만 S3 에서 삭제`() {
        val primaryUploaded = Regex("""^1/primary\.[\da-fA-F-]+\.jpg$""")
        every { port.findById(1L) } returns sampleShop
        every { port.update(1L, any()) } returns sampleShop
        every { imageStorage.putObject(any(), any(), any()) } returns Unit
        every { port.swapShopImageRecords(1L, any(), null, emptyList()) } returns listOf("1/primary.jpg")

        service.updateShopWithImages(
            1L,
            sampleShop,
            ImageUploadPart(tinyValidJpeg, "image/jpeg"),
            replaceGallery = false,
            gallery = emptyList(),
            existingGalleryImageIds = emptyList(),
        )

        verify {
            imageStorage.putObject(match { primaryUploaded.matches(it) }, any(), "image/jpeg")
        }
        verify {
            port.swapShopImageRecords(
                1L,
                match { it.role == ShopImageRole.PRIMARY && primaryUploaded.matches(it.s3Key) },
                null,
                emptyList(),
            )
        }
        verify { imageStorage.deleteObject("1/primary.jpg") }
        verify(exactly = 1) { imageStorage.deleteObject(any()) }
    }

    @Test
    fun `updateShopWithImages - 대표 확장자가 바뀌면 예전 키만 S3 삭제`() {
        val primaryUploaded = Regex("""^1/primary\.[\da-fA-F-]+\.jpg$""")
        every { port.findById(1L) } returns sampleShop
        every { port.update(1L, any()) } returns sampleShop
        every { imageStorage.putObject(any(), any(), any()) } returns Unit
        every { port.swapShopImageRecords(1L, any(), null, emptyList()) } returns listOf("1/primary.png")

        service.updateShopWithImages(
            1L,
            sampleShop,
            ImageUploadPart(tinyValidJpeg, "image/jpeg"),
            replaceGallery = false,
            gallery = emptyList(),
            existingGalleryImageIds = emptyList(),
        )

        verify { imageStorage.putObject(match { primaryUploaded.matches(it) }, any(), "image/jpeg") }
        verify { imageStorage.deleteObject("1/primary.png") }
        verify(exactly = 1) { imageStorage.deleteObject(any()) }
    }

    @Test
    fun `updateShopWithImages - 갤러리 교체 시 UUID 키로 업로드 후 기존 고정 키 전부 삭제`() {
        val g1Uploaded = Regex("""^1/gallery-1\.[\da-fA-F-]+\.png$""")
        every { port.findById(1L) } returns sampleShop
        every { port.update(1L, any()) } returns sampleShop
        every { imageStorage.putObject(any(), any(), any()) } returns Unit
        every {
            port.swapShopImageRecords(1L, null, any(), emptyList())
        } returns listOf("1/gallery-1.png", "1/gallery-2.png")

        service.updateShopWithImages(
            1L,
            sampleShop,
            coverImage = null,
            replaceGallery = true,
            gallery = listOf(ImageUploadPart(minimalPngBytes, "image/png")),
            existingGalleryImageIds = emptyList(),
        )

        verify { imageStorage.putObject(match { g1Uploaded.matches(it) }, any(), "image/png") }
        verify { imageStorage.deleteObject("1/gallery-1.png") }
        verify { imageStorage.deleteObject("1/gallery-2.png") }
        verify(exactly = 2) { imageStorage.deleteObject(any()) }
    }

    @Test
    fun `updateShopWithImages - replaceGallery true 에 갤러리 비우면 swap 만 호출`() {
        every { port.findById(1L) } returns sampleShop
        every { port.update(1L, any()) } returns sampleShop
        every { port.swapShopImageRecords(1L, null, emptyList(), emptyList()) } returns listOf("1/gallery-1.png")

        service.updateShopWithImages(
            1L,
            sampleShop,
            coverImage = null,
            replaceGallery = true,
            gallery = emptyList(),
            existingGalleryImageIds = emptyList(),
        )

        verify(exactly = 0) { imageStorage.putObject(any(), any(), any()) }
        verify { port.swapShopImageRecords(1L, null, emptyList(), emptyList()) }
        verify { imageStorage.deleteObject("1/gallery-1.png") }
    }

    @Test
    fun `deleteShop - 샵 삭제 성공`() {
        every { port.deleteById(1L) } returns Unit
        service.deleteShop(1L)
        verify { port.deleteById(1L) }
    }

    companion object {

        /** 1×1 화살 무늬 검사 패턴 포함 최소 PNG. */
        val minimalPngBytes: ByteArray = byteArrayOf(
            0x89.toByte(), 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A,
            0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52,
            0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
            0x08, 0x06, 0x00, 0x00, 0x00, 0x1F.toByte(), 0x15.toByte(), 0xC4.toByte(), 0x89.toByte(),
            0x00, 0x00, 0x00, 0x0A, 0x49, 0x44, 0x41, 0x54, 0x78.toByte(), 0x9C.toByte(),
            0x63, 0x00, 0x01, 0x00, 0x00, 0x05, 0x00, 0x01, 0x0D.toByte(), 0x0A.toByte(), 0x2D.toByte(), 0xB4.toByte(),
            0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4E, 0x44, 0xAE.toByte(), 0x42, 0x60, 0x82.toByte(),
        )

        val tinyValidJpeg: ByteArray by lazy {
            val img = BufferedImage(1, 1, BufferedImage.TYPE_INT_RGB)
            ByteArrayOutputStream().use { os ->
                ImageIO.write(img, "jpg", os)
                os.toByteArray()
            }
        }
    }
}
