package com.aniwhere.server.adapter.out.persistence

import com.aniwhere.server.adapter.out.persistence.entity.CategoryEntity
import com.aniwhere.server.adapter.out.persistence.entity.ShopEntity
import com.aniwhere.server.adapter.out.persistence.entity.ShopStatusEnum
import com.aniwhere.server.adapter.out.persistence.entity.WorkEntity
import com.aniwhere.server.adapter.out.persistence.mapper.ShopMapper
import com.aniwhere.server.adapter.out.persistence.repository.CategoryRepository
import com.aniwhere.server.adapter.out.persistence.repository.RegionRepository
import com.aniwhere.server.adapter.out.persistence.repository.ShopRepository
import com.aniwhere.server.adapter.out.persistence.repository.WorkRepository
import com.aniwhere.server.common.exception.BadRequestException
import com.aniwhere.server.config.ShopImagesS3Properties
import com.aniwhere.server.domain.shop.model.Shop
import com.aniwhere.server.domain.shop.model.ShopStatus
import io.mockk.every
import io.mockk.impl.annotations.MockK
import io.mockk.junit5.MockKExtension
import io.mockk.slot
import io.mockk.verify
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.assertThrows
import org.junit.jupiter.api.extension.ExtendWith
import org.springframework.data.repository.findByIdOrNull
import java.math.BigDecimal

@ExtendWith(MockKExtension::class)
class ShopPersistenceAdapterTest {

    @MockK
    private lateinit var shopRepo: ShopRepository

    @MockK
    private lateinit var regionRepo: RegionRepository

    @MockK
    private lateinit var categoryRepo: CategoryRepository

    @MockK
    private lateinit var workRepo: WorkRepository

    private lateinit var adapter: ShopPersistenceAdapter

    private val shopMapper = ShopMapper(ShopImagesS3Properties())

    private val sampleShop = Shop(
        name = "테스트샵",
        address = "서울시 강남구",
        px = BigDecimal("127.0276368"),
        py = BigDecimal("37.4979462"),
        categoryIds = listOf(1, 2),
        workIds = listOf(10),
        status = ShopStatus.ACTIVE,
    )

    @BeforeEach
    fun setup() {
        adapter = ShopPersistenceAdapter(shopRepo, regionRepo, categoryRepo, workRepo, shopMapper)
    }

    @Test
    fun `save - categoryIds와 workIds를 entity M2M에 반영`() {
        val category1 = CategoryEntity(id = 1, name = "피규어")
        val category2 = CategoryEntity(id = 2, name = "굿즈")
        val work = object : WorkEntity(id = 10, name = "원피스") {}
        every { categoryRepo.findAllById(listOf<Short>(1, 2)) } returns listOf(category1, category2)
        every { workRepo.findAllById(listOf(10)) } returns listOf(work)

        val savedSlot = slot<ShopEntity>()
        every { shopRepo.save(capture(savedSlot)) } answers { firstArg() }

        adapter.save(sampleShop.copy(id = null))

        assertEquals(setOf(category1, category2), savedSlot.captured.categories)
        assertEquals(setOf(work), savedSlot.captured.works)
    }

    @Test
    fun `update - categoryIds와 workIds를 전체 교체`() {
        val existing = ShopEntity(
            id = 1L,
            name = "기존",
            address = "주소",
            px = BigDecimal.ONE,
            py = BigDecimal.ONE,
            status = ShopStatusEnum.active,
        ).apply {
            categories.add(CategoryEntity(id = 99, name = "제거될"))
        }
        val category = CategoryEntity(id = 1, name = "피규어")
        val work = object : WorkEntity(id = 10, name = "원피스") {}

        every { shopRepo.findByIdOrNull(1L) } returns existing
        every { categoryRepo.findAllById(listOf<Short>(1)) } returns listOf(category)
        every { workRepo.findAllById(listOf(10)) } returns listOf(work)
        every { shopRepo.save(any()) } answers { firstArg() }

        adapter.update(1L, sampleShop.copy(categoryIds = listOf(1), workIds = listOf(10)))

        assertEquals(setOf(category), existing.categories)
        assertEquals(setOf(work), existing.works)
        verify { shopRepo.save(existing) }
    }

    @Test
    fun `save - unknown category id면 BadRequestException`() {
        every { categoryRepo.findAllById(listOf<Short>(999)) } returns emptyList()

        val ex = assertThrows<BadRequestException> {
            adapter.save(sampleShop.copy(id = null, categoryIds = listOf(999), workIds = emptyList()))
        }
        assertEquals("Unknown categoryIds: 999", ex.message)
        verify(exactly = 0) { shopRepo.save(any()) }
    }

    @Test
    fun `save - duplicate workIds면 BadRequestException`() {
        val ex = assertThrows<BadRequestException> {
            adapter.save(sampleShop.copy(id = null, categoryIds = emptyList(), workIds = listOf(10, 10)))
        }
        assertEquals("Duplicate workIds: 10", ex.message)
        verify(exactly = 0) { shopRepo.save(any()) }
    }

    @Test
    fun `update - 빈 categoryIds와 workIds면 M2M 전부 해제`() {
        val existing = ShopEntity(
            id = 1L,
            name = "기존",
            address = "주소",
            px = BigDecimal.ONE,
            py = BigDecimal.ONE,
            status = ShopStatusEnum.active,
        ).apply {
            categories.add(CategoryEntity(id = 1, name = "피규어"))
            works.add(object : WorkEntity(id = 10, name = "원피스") {})
        }

        every { shopRepo.findByIdOrNull(1L) } returns existing
        every { shopRepo.save(any()) } answers { firstArg() }

        adapter.update(1L, sampleShop.copy(categoryIds = emptyList(), workIds = emptyList()))

        assertTrue(existing.categories.isEmpty())
        assertTrue(existing.works.isEmpty())
    }
}
