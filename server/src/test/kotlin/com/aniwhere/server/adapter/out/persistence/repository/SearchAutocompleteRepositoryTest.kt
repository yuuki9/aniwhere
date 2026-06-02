package com.aniwhere.server.adapter.out.persistence.repository

import com.aniwhere.server.adapter.out.persistence.entity.AnimationWorkEntity
import com.aniwhere.server.adapter.out.persistence.entity.GameWorkEntity
import com.aniwhere.server.adapter.out.persistence.entity.ShopEntity
import com.aniwhere.server.adapter.out.persistence.entity.ShopStatusEnum
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager
import org.springframework.data.domain.PageRequest
import java.math.BigDecimal

@DataJpaTest(
    properties = [
        "spring.jpa.hibernate.ddl-auto=none",
        "spring.datasource.url=jdbc:h2:mem:search-autocomplete-repo;MODE=MySQL;DB_CLOSE_DELAY=-1",
        "spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.H2Dialect",
        "spring.sql.init.mode=always",
        "spring.sql.init.schema-locations=classpath:test-shop-facets-schema.sql",
    ],
)
class SearchAutocompleteRepositoryTest {

    @Autowired
    private lateinit var entityManager: TestEntityManager

    @Autowired
    private lateinit var shopRepository: ShopRepository

    @Autowired
    private lateinit var workRepository: WorkRepository

    @BeforeEach
    fun seed() {
        entityManager.persist(
            ShopEntity(
                name = "홍대 원피스 굿즈",
                address = "서울",
                px = BigDecimal("127.0"),
                py = BigDecimal("37.5"),
                status = ShopStatusEnum.active,
            ),
        )
        entityManager.persist(
            ShopEntity(
                name = "강남 피규어샵",
                address = "서울",
                px = BigDecimal("127.1"),
                py = BigDecimal("37.6"),
                status = ShopStatusEnum.active,
            ),
        )
        entityManager.persist(
            AnimationWorkEntity(
                name = "One Piece",
                koreanTitle = "원피스",
                popularity = 100,
            ),
        )
        entityManager.persist(
            GameWorkEntity(name = "주술회전"),
        )
        entityManager.flush()
    }

    @Test
    fun `suggestShopNames - partial match ordered by name`() {
        val rows = shopRepository.suggestShopNames("원피", PageRequest.of(0, 10))

        assertEquals(1, rows.size)
        assertEquals("홍대 원피스 굿즈", rows.single().name)
    }

    @Test
    fun `suggestWorks - matches korean title`() {
        val rows = workRepository.suggestWorks("원피", PageRequest.of(0, 10))

        assertEquals(1, rows.size)
        assertEquals("One Piece", rows.single().name)
    }

    @Test
    fun `suggestWorks - matches game work name`() {
        val rows = workRepository.suggestWorks("주술", PageRequest.of(0, 10))

        assertEquals(1, rows.size)
        assertEquals("주술회전", rows.single().name)
    }
}
