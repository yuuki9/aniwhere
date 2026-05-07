package com.aniwhere.server.domain.shop.service

import com.aniwhere.server.common.exception.EntityNotFoundException
import com.aniwhere.server.config.ShopImagesS3Properties
import com.aniwhere.server.domain.shop.model.ImageUploadPart
import com.aniwhere.server.domain.shop.model.Shop
import com.aniwhere.server.domain.shop.model.ShopImageRole
import com.aniwhere.server.domain.shop.model.ShopStatus
import com.aniwhere.server.domain.shop.port.out.ShopImagePersistenceRow
import com.aniwhere.server.domain.shop.port.out.ShopImageStoragePort
import com.aniwhere.server.domain.shop.port.out.ShopPersistencePort
import io.mockk.every
import io.mockk.impl.annotations.MockK
import io.mockk.junit5.MockKExtension
import io.mockk.verify
import org.junit.jupiter.api.Assertions.*
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.assertThrows
import org.junit.jupiter.api.extension.ExtendWith
import org.springframework.data.domain.PageImpl
import org.springframework.data.domain.PageRequest
import java.math.BigDecimal

@ExtendWith(MockKExtension::class)
class ShopServiceTest {

    @MockK
    private lateinit var port: ShopPersistencePort

    @MockK
    private lateinit var imageStorage: ShopImageStoragePort

    private lateinit var service: ShopService

    private val sampleShop = Shop(
        id = 1L, name = "테스트샵", address = "서울시 강남구",
        px = BigDecimal("127.0276368"), py = BigDecimal("37.4979462"),
        status = ShopStatus.ACTIVE,
    )

    @BeforeEach
    fun setup() {
        service = ShopService(port, imageStorage, ShopImagesS3Properties(bucket = "test-bucket"))
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
        every { port.findAll(any(), any(), any(), any(), pageable) } returns PageImpl(listOf(sampleShop))
        val result = service.searchShops(regionId = 1, categoryName = null, keyword = "테스트", workName = null, pageable = pageable)
        assertEquals(1, result.totalElements)
    }

    @Test
    fun `createShop - 샵 생성 성공`() {
        every { port.save(any()) } returns sampleShop
        assertNotNull(service.createShop(sampleShop.copy(id = null)).id)
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
        val cover = ImageUploadPart(byteArrayOf(1, 2, 3), "image/jpeg")
        val gallery = listOf(ImageUploadPart(byteArrayOf(4), "image/png"))
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
    }

    @Test
    fun `updateShop - 샵 수정 성공`() {
        val updated = sampleShop.copy(name = "수정된샵")
        every { port.update(1L, any()) } returns updated
        assertEquals("수정된샵", service.updateShop(1L, updated).name)
    }

    @Test
    fun `deleteShop - 샵 삭제 성공`() {
        every { port.deleteById(1L) } returns Unit
        service.deleteShop(1L)
        verify { port.deleteById(1L) }
    }
}
