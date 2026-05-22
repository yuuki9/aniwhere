package com.aniwhere.server.adapter.out.persistence

import com.aniwhere.server.adapter.out.persistence.entity.CategoryEntity
import com.aniwhere.server.adapter.out.persistence.entity.ShopEntity
import com.aniwhere.server.adapter.out.persistence.entity.ShopStatusEnum
import com.aniwhere.server.adapter.out.persistence.entity.WorkEntity
import com.aniwhere.server.adapter.out.persistence.mapper.ShopMapper
import com.aniwhere.server.adapter.out.persistence.repository.CategoryRepository
import com.aniwhere.server.adapter.out.persistence.repository.CategoryFacetCountRow
import com.aniwhere.server.adapter.out.persistence.repository.RegionRepository
import com.aniwhere.server.adapter.out.persistence.repository.RegionFacetCountRow
import com.aniwhere.server.adapter.out.persistence.repository.ShopRepository
import com.aniwhere.server.adapter.out.persistence.repository.StatusFacetCountRow
import com.aniwhere.server.adapter.out.persistence.repository.WorkFacetCatalogRow
import com.aniwhere.server.adapter.out.persistence.repository.WorkFacetGroupCountRow
import com.aniwhere.server.adapter.out.persistence.repository.WorkRepository
import com.aniwhere.server.common.exception.BadRequestException
import com.aniwhere.server.config.ShopImagesS3Properties
import com.aniwhere.server.domain.shop.model.ShopFacetQuery
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
import org.springframework.data.domain.PageImpl
import org.springframework.data.domain.PageRequest
import org.springframework.data.repository.findByIdOrNull
import java.math.BigDecimal
import com.aniwhere.server.domain.work.model.WorkType

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
    fun `findAll - category 이름과 categoryIds를 함께 repository로 전달`() {
        val pageable = PageRequest.of(0, 20)
        every {
            shopRepo.search(
                1,
                "피규어",
                true,
                setOf<Short>(1, 2),
                "테스트",
                null,
                null,
                ShopStatusEnum.active,
                pageable,
            )
        } returns PageImpl(emptyList())

        adapter.findAll(
            regionId = 1,
            categoryName = "피규어",
            categoryIds = setOf(1, 2),
            keyword = "테스트",
            workKeyword = null,
            workId = null,
            status = ShopStatus.ACTIVE,
            pageable = pageable,
        )

        verify {
            shopRepo.search(
                1,
                "피규어",
                true,
                setOf<Short>(1, 2),
                "테스트",
                null,
                null,
                ShopStatusEnum.active,
                pageable,
            )
        }
    }

    @Test
    fun `findFacets - count가 0이면 disabled=true`() {
        every {
            shopRepo.findRegionFacetCounts(any(), any(), any(), any(), any(), any(), any(), any(), any(), any(), any())
        } returns listOf(
            RegionFacetCountRow(id = 1, name = "홍대", count = 0),
        )
        every {
            shopRepo.findCategoryFacetCounts(any(), any(), any(), any(), any(), any(), any(), any(), any(), any(), any(), any())
        } returns emptyList()
        every { shopRepo.findWorkFacetCatalog(any()) } returns emptyList()
        every {
            shopRepo.findWorkFacetCandidateCounts(any(), any(), any(), any(), any(), any(), any(), any(), any(), any(), any())
        } returns emptyList()
        every { shopRepo.countWorkFacetSelectedBase(any(), any(), any(), any(), any(), any(), any(), any(), any(), any(), any(), any()) } returns 0
        every {
            shopRepo.findWorkFacetSelectedIntersections(any(), any(), any(), any(), any(), any(), any(), any(), any(), any(), any(), any(), any())
        } returns emptyList()
        every {
            shopRepo.findStatusFacetCounts(any(), any(), any(), any(), any(), any(), any(), any(), any(), any(), any())
        } returns emptyList()

        val result = adapter.findFacets(ShopFacetQuery())

        assertTrue(result.regions.single().disabled)
        assertEquals(0, result.regions.single().count)
    }

    @Test
    fun `findFacets - query의 선택값을 selected에 반영`() {
        every {
            shopRepo.findRegionFacetCounts(any(), any(), any(), any(), any(), any(), any(), any(), any(), any(), any())
        } returns listOf(
            RegionFacetCountRow(id = 1, name = "홍대", count = 3),
            RegionFacetCountRow(id = 2, name = "합정", count = 1),
        )
        every {
            shopRepo.findCategoryFacetCounts(any(), any(), any(), any(), any(), any(), any(), any(), any(), any(), any(), any())
        } returns listOf(
            CategoryFacetCountRow(id = 10, name = "피규어", count = 2),
            CategoryFacetCountRow(id = 20, name = "굿즈", count = 0),
        )
        every { shopRepo.findWorkFacetCatalog(any()) } returns listOf(
            WorkFacetCatalogRow(id = 100, name = "원피스", coverUrl = "https://example.com/onepiece.jpg"),
            WorkFacetCatalogRow(id = 200, name = "주술회전", coverUrl = null),
        )
        every {
            shopRepo.findWorkFacetCandidateCounts(any(), any(), any(), any(), any(), any(), any(), any(), any(), any(), any())
        } returns listOf(
            WorkFacetGroupCountRow(workId = 100, count = 2),
            WorkFacetGroupCountRow(workId = 200, count = 0),
        )
        every { shopRepo.countWorkFacetSelectedBase(any(), any(), any(), any(), any(), any(), any(), any(), any(), any(), any(), any()) } returns 2
        every {
            shopRepo.findWorkFacetSelectedIntersections(any(), any(), any(), any(), any(), any(), any(), any(), any(), any(), any(), any(), any())
        } returns listOf(
            WorkFacetGroupCountRow(workId = 100, count = 2),
            WorkFacetGroupCountRow(workId = 200, count = 0),
        )
        every {
            shopRepo.findStatusFacetCounts(any(), any(), any(), any(), any(), any(), any(), any(), any(), any(), any())
        } returns listOf(
            StatusFacetCountRow(status = ShopStatusEnum.active, count = 4),
            StatusFacetCountRow(status = ShopStatusEnum.closed, count = 1),
        )

        val result = adapter.findFacets(
            ShopFacetQuery(
                regionIds = setOf(1),
                categoryIds = setOf(20),
                workIds = setOf(100),
                status = ShopStatus.CLOSED,
            ),
        )

        assertTrue(result.regions.single { it.id == 1.toShort() }.selected)
        assertTrue(result.categories.single { it.id == 20.toShort() }.selected)
        assertTrue(result.works.single { it.id == 100 }.selected)
        assertTrue(result.statuses.single { it.value == ShopStatus.CLOSED.name }.selected)
        assertEquals("https://example.com/onepiece.jpg", result.works.single { it.id == 100 }.coverUrl)
    }

    @Test
    fun `findFacets - AND across groups와 OR in group를 위한 필터 파라미터 전달`() {
        every {
            shopRepo.findRegionFacetCounts(any(), any(), any(), any(), any(), any(), any(), any(), any(), any(), any())
        } returns emptyList()
        every {
            shopRepo.findCategoryFacetCounts(any(), any(), any(), any(), any(), any(), any(), any(), any(), any(), any(), any())
        } returns emptyList()
        every { shopRepo.findWorkFacetCatalog(any()) } returns emptyList()
        every {
            shopRepo.findWorkFacetCandidateCounts(any(), any(), any(), any(), any(), any(), any(), any(), any(), any(), any())
        } returns emptyList()
        every { shopRepo.countWorkFacetSelectedBase(any(), any(), any(), any(), any(), any(), any(), any(), any(), any(), any(), any()) } returns 0
        every {
            shopRepo.findWorkFacetSelectedIntersections(any(), any(), any(), any(), any(), any(), any(), any(), any(), any(), any(), any(), any())
        } returns emptyList()
        every {
            shopRepo.findStatusFacetCounts(any(), any(), any(), any(), any(), any(), any(), any(), any(), any(), any())
        } returns emptyList()

        val query = ShopFacetQuery(
            keyword = "애니",
            regionIds = setOf(1, 2),
            categoryIds = setOf(10, 20),
            workIds = setOf(100, 200),
            status = ShopStatus.ACTIVE,
            swLat = BigDecimal("37.1"),
            swLng = BigDecimal("127.1"),
            neLat = BigDecimal("37.9"),
            neLng = BigDecimal("127.9"),
        )

        adapter.findFacets(query)

        verify {
            shopRepo.findRegionFacetCounts(
                "애니",
                setOf<Short>(1, 2),
                true,
                setOf<Short>(10, 20),
                true,
                setOf(100, 200),
                ShopStatusEnum.active,
                BigDecimal("37.1"),
                BigDecimal("127.1"),
                BigDecimal("37.9"),
                BigDecimal("127.9"),
            )
        }
        verify {
            shopRepo.findStatusFacetCounts(
                "애니",
                true,
                setOf<Short>(1, 2),
                true,
                setOf<Short>(10, 20),
                true,
                setOf(100, 200),
                BigDecimal("37.1"),
                BigDecimal("127.1"),
                BigDecimal("37.9"),
                BigDecimal("127.9"),
            )
        }
    }

    @Test
    fun `findFacets - works type 필터를 repository에 전달`() {
        every {
            shopRepo.findRegionFacetCounts(any(), any(), any(), any(), any(), any(), any(), any(), any(), any(), any())
        } returns emptyList()
        every {
            shopRepo.findCategoryFacetCounts(any(), any(), any(), any(), any(), any(), any(), any(), any(), any(), any(), any())
        } returns emptyList()
        every { shopRepo.findWorkFacetCatalog(any()) } returns emptyList()
        every {
            shopRepo.findWorkFacetCandidateCounts(any(), any(), any(), any(), any(), any(), any(), any(), any(), any(), any())
        } returns emptyList()
        every { shopRepo.countWorkFacetSelectedBase(any(), any(), any(), any(), any(), any(), any(), any(), any(), any(), any(), any()) } returns 0
        every {
            shopRepo.findWorkFacetSelectedIntersections(any(), any(), any(), any(), any(), any(), any(), any(), any(), any(), any(), any(), any())
        } returns emptyList()
        every {
            shopRepo.findStatusFacetCounts(any(), any(), any(), any(), any(), any(), any(), any(), any(), any(), any())
        } returns emptyList()

        adapter.findFacets(ShopFacetQuery(type = WorkType.ANIMATION))

        verify {
            shopRepo.findWorkFacetCatalog("ANIMATION")
        }
        verify {
            shopRepo.findWorkFacetCandidateCounts(
                null,
                false,
                emptySet(),
                false,
                emptySet(),
                null,
                null,
                null,
                null,
                null,
                "ANIMATION",
            )
        }
        verify(exactly = 0) { shopRepo.countWorkFacetSelectedBase(any(), any(), any(), any(), any(), any(), any(), any(), any(), any(), any(), any()) }
    }

    @Test
    fun `findFacets - work facet union count는 selectedBase + candidate - intersection`() {
        every {
            shopRepo.findRegionFacetCounts(any(), any(), any(), any(), any(), any(), any(), any(), any(), any(), any())
        } returns emptyList()
        every {
            shopRepo.findCategoryFacetCounts(any(), any(), any(), any(), any(), any(), any(), any(), any(), any(), any(), any())
        } returns emptyList()
        every { shopRepo.findWorkFacetCatalog(any()) } returns listOf(
            WorkFacetCatalogRow(id = 100, name = "원피스", coverUrl = "https://example.com/onepiece.jpg"),
            WorkFacetCatalogRow(id = 200, name = "원신", coverUrl = "https://example.com/genshin.jpg"),
        )
        every {
            shopRepo.findWorkFacetCandidateCounts(any(), any(), any(), any(), any(), any(), any(), any(), any(), any(), any())
        } returns listOf(
            WorkFacetGroupCountRow(workId = 100, count = 5),
            WorkFacetGroupCountRow(workId = 200, count = 4),
        )
        every {
            shopRepo.countWorkFacetSelectedBase(any(), any(), any(), any(), any(), any(), any(), any(), any(), any(), any(), any())
        } returns 3
        every {
            shopRepo.findWorkFacetSelectedIntersections(any(), any(), any(), any(), any(), any(), any(), any(), any(), any(), any(), any(), any())
        } returns listOf(
            WorkFacetGroupCountRow(workId = 100, count = 3),
            WorkFacetGroupCountRow(workId = 200, count = 1),
        )
        every {
            shopRepo.findStatusFacetCounts(any(), any(), any(), any(), any(), any(), any(), any(), any(), any(), any())
        } returns emptyList()

        val result = adapter.findFacets(ShopFacetQuery(workIds = setOf(100)))

        assertEquals(3, result.works.single { it.id == 100 }.count)
        assertEquals(6, result.works.single { it.id == 200 }.count)
    }
}
