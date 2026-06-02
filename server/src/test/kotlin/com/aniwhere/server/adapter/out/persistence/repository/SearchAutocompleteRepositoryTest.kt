package com.aniwhere.server.adapter.out.persistence.repository

import com.aniwhere.server.common.text.LikePattern
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
        val rows = shopRepository.suggestShopNames(
            LikePattern.escapeForContains("원피"),
            PageRequest.of(0, 10),
        )

        assertEquals(1, rows.size)
        assertEquals("홍대 원피스 굿즈", rows.single().name)
    }

    @Test
    fun `suggestShopNames - percent in query is literal not wildcard`() {
        entityManager.persist(
            ShopEntity(
                name = "할인 100% 매장",
                address = "서울",
                px = BigDecimal("127.2"),
                py = BigDecimal("37.7"),
                status = ShopStatusEnum.active,
            ),
        )
        entityManager.flush()

        val escaped = LikePattern.escapeForContains("100%")
        val matched = shopRepository.suggestShopNames(escaped, PageRequest.of(0, 10))
        val percentWildcard = shopRepository.suggestShopNames("%", PageRequest.of(0, 10))

        assertEquals(1, matched.size)
        assertEquals("할인 100% 매장", matched.single().name)
        assertEquals(3, percentWildcard.size)
    }

    @Test
    fun `suggestWorks - matches korean title`() {
        val rows = workRepository.suggestWorks(
            LikePattern.escapeForContains("원피"),
            PageRequest.of(0, 10),
        )

        assertEquals(1, rows.size)
        assertEquals("One Piece", rows.single().name)
    }

    @Test
    fun `suggestWorks - matches game work name`() {
        val rows = workRepository.suggestWorks(
            LikePattern.escapeForContains("주술"),
            PageRequest.of(0, 10),
        )

        assertEquals(1, rows.size)
        assertEquals("주술회전", rows.single().name)
    }

    @Test
    fun `suggestWorks - underscore in query is literal not wildcard`() {
        entityManager.persist(
            AnimationWorkEntity(
                name = "a_b_series",
                koreanTitle = "언더스코어 작품",
                popularity = 1,
            ),
        )
        entityManager.persist(
            AnimationWorkEntity(
                name = "axb_series",
                koreanTitle = "다른 작품",
                popularity = 2,
            ),
        )
        entityManager.flush()

        val escaped = LikePattern.escapeForContains("a_b")
        val matched = workRepository.suggestWorks(escaped, PageRequest.of(0, 10))
        val unescaped = workRepository.suggestWorks("a_b", PageRequest.of(0, 10))

        assertEquals(1, matched.size)
        assertEquals("a_b_series", matched.single().name)
        assertEquals(2, unescaped.size)
    }
}
