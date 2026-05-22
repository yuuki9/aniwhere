package com.aniwhere.server.adapter.out.persistence.repository

import com.aniwhere.server.adapter.out.persistence.entity.CategoryEntity
import com.aniwhere.server.adapter.out.persistence.entity.GameWorkEntity
import com.aniwhere.server.adapter.out.persistence.entity.RegionEntity
import com.aniwhere.server.adapter.out.persistence.entity.ShopEntity
import com.aniwhere.server.adapter.out.persistence.entity.ShopStatusEnum
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager
import java.math.BigDecimal

@DataJpaTest(
    properties = [
        "spring.jpa.hibernate.ddl-auto=none",
        "spring.datasource.url=jdbc:h2:mem:shop-facet-repo;MODE=MySQL;DB_CLOSE_DELAY=-1",
        "spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.H2Dialect",
        "spring.sql.init.mode=always",
        "spring.sql.init.schema-locations=classpath:test-shop-facets-schema.sql",
    ],
)
class ShopRepositoryFacetQueryTest {

    @Autowired
    private lateinit var entityManager: TestEntityManager

    @Autowired
    private lateinit var shopRepository: ShopRepository

    private lateinit var regionGangnam: RegionEntity
    private lateinit var regionHongdae: RegionEntity
    private lateinit var regionBusan: RegionEntity
    private lateinit var categoryFigure: CategoryEntity
    private lateinit var categoryGoods: CategoryEntity
    private lateinit var categoryCafe: CategoryEntity
    private lateinit var workOnePiece: GameWorkEntity
    private lateinit var workJujutsu: GameWorkEntity
    private lateinit var gameGenshin: GameWorkEntity

    @BeforeEach
    fun seed() {
        regionGangnam = entityManager.persist(RegionEntity(name = "강남"))
        regionHongdae = entityManager.persist(RegionEntity(name = "홍대"))
        regionBusan = entityManager.persist(RegionEntity(name = "부산"))

        categoryFigure = entityManager.persist(CategoryEntity(name = "피규어"))
        categoryGoods = entityManager.persist(CategoryEntity(name = "굿즈"))
        categoryCafe = entityManager.persist(CategoryEntity(name = "카페"))

        workOnePiece = entityManager.persist(
            GameWorkEntity(name = "원피스", coverUrl = "https://example.com/onepiece.jpg"),
        )
        workJujutsu = entityManager.persist(
            GameWorkEntity(name = "주술회전", coverUrl = "https://example.com/jujutsu.jpg"),
        )
        gameGenshin = entityManager.persist(
            GameWorkEntity(name = "원신", coverUrl = "https://example.com/genshin.jpg"),
        )

        persistShop(
            name = "원피스 굿즈샵",
            region = regionGangnam,
            categories = listOf(categoryFigure),
            works = listOf(workOnePiece),
            status = ShopStatusEnum.active,
            px = BigDecimal("127.1000000"),
            py = BigDecimal("37.1000000"),
        )
        persistShop(
            name = "원피스 게임샵",
            region = regionGangnam,
            categories = listOf(categoryGoods),
            works = listOf(workOnePiece, gameGenshin),
            status = ShopStatusEnum.closed,
            px = BigDecimal("127.2000000"),
            py = BigDecimal("37.2000000"),
        )
        persistShop(
            name = "게임 전문점",
            region = regionHongdae,
            categories = listOf(categoryGoods),
            works = listOf(gameGenshin),
            status = ShopStatusEnum.active,
            px = BigDecimal("127.3000000"),
            py = BigDecimal("37.3000000"),
        )
        persistShop(
            name = "애니 카페",
            region = regionHongdae,
            categories = listOf(categoryFigure, categoryCafe),
            works = listOf(workJujutsu),
            status = ShopStatusEnum.unverified,
            px = BigDecimal("127.1500000"),
            py = BigDecimal("37.1500000"),
        )
        persistShop(
            name = "부산 피규어",
            region = regionBusan,
            categories = listOf(categoryFigure),
            works = listOf(workJujutsu),
            status = ShopStatusEnum.active,
            px = BigDecimal("129.0500000"),
            py = BigDecimal("35.1500000"),
        )

        entityManager.flush()
        entityManager.clear()
    }

    @Test
    fun `status facet query - group 간 AND, group 내 OR`() {
        val rows = shopRepository.findStatusFacetCounts(
            keyword = null,
            applyRegion = true,
            regionIds = setOf(regionGangnam.id!!, regionHongdae.id!!),
            applyCategory = true,
            categoryIds = setOf(categoryFigure.id!!, categoryGoods.id!!),
            applyWork = true,
            workIds = setOf(workOnePiece.id!!, gameGenshin.id!!),
            swLat = null,
            swLng = null,
            neLat = null,
            neLng = null,
        )

        val map = rows.associate { it.status to it.count }
        assertEquals(2L, map[ShopStatusEnum.active])
        assertEquals(1L, map[ShopStatusEnum.closed])
        assertEquals(null, map[ShopStatusEnum.unverified])
    }

    @Test
    fun `region facet query - selected와 candidate union 카운트`() {
        val rows = shopRepository.findRegionFacetCounts(
            keyword = null,
            selectedRegionIds = setOf(regionGangnam.id!!),
            applyCategory = false,
            categoryIds = emptySet(),
            applyWork = false,
            workIds = emptySet(),
            status = null,
            swLat = null,
            swLng = null,
            neLat = null,
            neLng = null,
        )

        val countByRegion = rows.associate { it.id to it.count }
        assertEquals(2L, countByRegion[regionGangnam.id])
        assertEquals(4L, countByRegion[regionHongdae.id])
        assertEquals(3L, countByRegion[regionBusan.id])
    }

    @Test
    fun `status facet query - 상태 그룹 카운트 계산`() {
        val rows = shopRepository.findStatusFacetCounts(
            keyword = null,
            applyRegion = true,
            regionIds = setOf(regionGangnam.id!!),
            applyCategory = false,
            categoryIds = emptySet(),
            applyWork = false,
            workIds = emptySet(),
            swLat = null,
            swLng = null,
            neLat = null,
            neLng = null,
        )

        val map = rows.associate { it.status to it.count }
        assertEquals(1L, map[ShopStatusEnum.active])
        assertEquals(1L, map[ShopStatusEnum.closed])
        assertEquals(null, map[ShopStatusEnum.unverified])
    }

    @Test
    fun `status facet query - bounds와 keyword를 함께 적용`() {
        val rows = shopRepository.findStatusFacetCounts(
            keyword = "원피스",
            applyRegion = false,
            regionIds = emptySet(),
            applyCategory = false,
            categoryIds = emptySet(),
            applyWork = false,
            workIds = emptySet(),
            swLat = BigDecimal("37.0500000"),
            swLng = BigDecimal("127.0500000"),
            neLat = BigDecimal("37.2500000"),
            neLng = BigDecimal("127.2500000"),
        )

        val map = rows.associate { it.status to it.count }
        assertEquals(1L, map[ShopStatusEnum.active])
        assertEquals(1L, map[ShopStatusEnum.closed])
        assertEquals(null, map[ShopStatusEnum.unverified])
    }

    @Test
    fun `work facet catalog query - type 필터 동작`() {
        val gameRows = shopRepository.findWorkFacetCatalog("GAME")
        val animationRows = shopRepository.findWorkFacetCatalog("ANIMATION")

        assertEquals(3, gameRows.size)
        assertEquals(setOf(workOnePiece.id, workJujutsu.id, gameGenshin.id), gameRows.map { it.id }.toSet())
        assertEquals("https://example.com/onepiece.jpg", gameRows.first { it.id == workOnePiece.id }.coverUrl)
        assertTrue(animationRows.isEmpty())
    }

    @Test
    fun `work facet candidate counts query - AND 그룹과 OR 그룹 필터`() {
        val rows = shopRepository.findWorkFacetCandidateCounts(
            keyword = null,
            applyRegion = true,
            regionIds = setOf(regionGangnam.id!!, regionHongdae.id!!),
            applyCategory = true,
            categoryIds = setOf(categoryFigure.id!!, categoryGoods.id!!),
            status = null,
            swLat = null,
            swLng = null,
            neLat = null,
            neLng = null,
            workType = "GAME",
        )

        val map = rows.associate { it.workId to it.count }
        assertEquals(2L, map[workOnePiece.id])
        assertEquals(2L, map[gameGenshin.id])
        assertEquals(1L, map[workJujutsu.id])
    }

    @Test
    fun `work facet selected intersections query - selected works와 후보 works 교집합`() {
        val rows = shopRepository.findWorkFacetSelectedIntersections(
            keyword = null,
            applyRegion = true,
            regionIds = setOf(regionGangnam.id!!, regionHongdae.id!!),
            applyCategory = true,
            categoryIds = setOf(categoryFigure.id!!, categoryGoods.id!!),
            status = null,
            swLat = null,
            swLng = null,
            neLat = null,
            neLng = null,
            applySelectedWork = true,
            selectedWorkIds = setOf(workOnePiece.id!!),
            workType = "GAME",
        )

        val map = rows.associate { it.workId to it.count }
        assertEquals(2L, map[workOnePiece.id])
        assertEquals(1L, map[gameGenshin.id])
        assertEquals(null, map[workJujutsu.id])
    }

    private fun persistShop(
        name: String,
        region: RegionEntity,
        categories: List<CategoryEntity>,
        works: List<com.aniwhere.server.adapter.out.persistence.entity.WorkEntity>,
        status: ShopStatusEnum,
        px: BigDecimal,
        py: BigDecimal,
    ) {
        val shop = ShopEntity(
            name = name,
            address = "$name 주소",
            px = px,
            py = py,
            region = region,
            status = status,
        )
        shop.categories.addAll(categories)
        shop.works.addAll(works)
        entityManager.persist(shop)
    }
}
