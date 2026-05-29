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
import com.aniwhere.server.domain.category.model.CategoryListItem
import com.aniwhere.server.domain.region.model.RegionListItem
import com.aniwhere.server.domain.work.model.WorkType
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
import org.springframework.data.domain.PageImpl
import org.springframework.data.domain.PageRequest
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

    @Test
    fun `findAll - regionIds categoryIds workIds를 repository로 전달`() {
        val pageable = PageRequest.of(0, 20)
        every {
            shopRepo.search(
                true,
                setOf<Short>(1),
                true,
                setOf<Short>(1, 2),
                "테스트",
                null,
                true,
                setOf(10, 20),
                "ANIMATION",
                ShopStatusEnum.active,
                pageable,
            )
        } returns PageImpl(emptyList())

        adapter.findAll(
            regionIds = setOf(1),
            categoryIds = setOf(1, 2),
            keyword = "테스트",
            workKeyword = null,
            workIds = setOf(10, 20),
            workType = WorkType.ANIMATION,
            status = ShopStatus.ACTIVE,
            pageable = pageable,
        )

        verify {
            shopRepo.search(
                true,
                setOf<Short>(1),
                true,
                setOf<Short>(1, 2),
                "테스트",
                null,
                true,
                setOf(10, 20),
                "ANIMATION",
                ShopStatusEnum.active,
                pageable,
            )
        }
    }

    @Test
    fun `findFacets - region category workType 옵션 목록을 반환`() {
        every { regionRepo.findAllWithShopCount() } returns listOf(
            RegionListItem(id = 1, name = "홍대", city = "서울", count = 2),
        )
        every { categoryRepo.findAllWithShopCount() } returns listOf(
            CategoryListItem(id = 10, name = "피규어", count = 3),
        )

        val result = adapter.findFacets(
            includeRegions = true,
            includeCategories = true,
            includeWorkTypes = true,
            includeSorts = true,
        )

        assertEquals(1.toShort(), result.regions.single().id)
        assertEquals("홍대", result.regions.single().name)
        assertEquals(10.toShort(), result.categories.single().id)
        assertEquals("피규어", result.categories.single().name)
        assertEquals(setOf("ANIMATION", "GAME"), result.workTypes.map { it.value }.toSet())
        assertEquals(setOf("애니메이션", "게임"), result.workTypes.map { it.label }.toSet())
        assertEquals(
            setOf("NEWEST", "REVIEW_COUNT_DESC", "FAVORITE_COUNT_DESC"),
            result.sorts.map { it.value }.toSet(),
        )
        assertEquals(setOf("최신순", "리뷰 많은순", "즐겨찾기 많은순"), result.sorts.map { it.label }.toSet())
    }

    @Test
    fun `findFacets - options 조회 시 shop facet query repository는 호출하지 않는다`() {
        every { regionRepo.findAllWithShopCount() } returns emptyList()
        every { categoryRepo.findAllWithShopCount() } returns emptyList()

        adapter.findFacets(includeRegions = true, includeCategories = true, includeWorkTypes = true, includeSorts = true)

        verify(exactly = 0) { shopRepo.findRegionFacetCounts(any(), any(), any(), any(), any(), any(), any(), any(), any(), any(), any()) }
        verify(exactly = 0) { shopRepo.findCategoryFacetCounts(any(), any(), any(), any(), any(), any(), any(), any(), any(), any(), any(), any()) }
        verify(exactly = 0) { shopRepo.findWorkFacetCatalog(any()) }
        verify(exactly = 0) { shopRepo.findStatusFacetCounts(any(), any(), any(), any(), any(), any(), any(), any(), any(), any(), any()) }
    }

    @Test
    fun `findFacets - include false 인 옵션은 조회하지 않고 빈 배열로 반환`() {
        every { categoryRepo.findAllWithShopCount() } returns listOf(
            CategoryListItem(id = 10, name = "피규어", count = 3),
        )

        val result = adapter.findFacets(
            includeRegions = false,
            includeCategories = true,
            includeWorkTypes = false,
            includeSorts = false,
        )

        assertTrue(result.regions.isEmpty())
        assertEquals(1, result.categories.size)
        assertTrue(result.workTypes.isEmpty())
        assertTrue(result.sorts.isEmpty())
        verify(exactly = 0) { regionRepo.findAllWithShopCount() }
        verify(exactly = 1) { categoryRepo.findAllWithShopCount() }
    }
}
