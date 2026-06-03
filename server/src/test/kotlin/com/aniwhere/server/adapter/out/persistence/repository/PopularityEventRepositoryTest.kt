package com.aniwhere.server.adapter.out.persistence.repository

import com.aniwhere.server.adapter.out.persistence.entity.PopularityEventEntity
import com.aniwhere.server.adapter.out.persistence.entity.ShopEntity
import com.aniwhere.server.adapter.out.persistence.entity.ShopStatusEnum
import com.aniwhere.server.domain.popularity.model.PopularityEventType
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertFalse
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest
import org.springframework.test.context.TestPropertySource
import java.math.BigDecimal
import java.time.LocalDateTime

@DataJpaTest(
    properties = [
        "spring.sql.init.mode=always",
        "spring.sql.init.schema-locations=classpath:test-shop-facets-schema.sql,classpath:test-popularity-schema.sql",
    ],
)
@TestPropertySource(properties = ["spring.jpa.hibernate.ddl-auto=none"])
class PopularityEventRepositoryTest {

    @Autowired
    private lateinit var eventRepo: PopularityEventRepository

    @Autowired
    private lateinit var shopRepo: ShopRepository

    @Test
    fun `aggregateShopScores - sums weighted events in window`() {
        val shop = shopRepo.save(sampleShop("테스트 매장"))
        val shopId = requireNotNull(shop.id)
        val now = LocalDateTime.now()
        eventRepo.save(
            popularityEvent(userId = 1L, shopId = shopId, type = PopularityEventType.SEARCH_AUTOCOMPLETE_SELECTED, at = now),
        )
        eventRepo.save(
            popularityEvent(userId = 2L, shopId = shopId, type = PopularityEventType.DISCOVERY_RESULT_CLICKED, at = now),
        )

        val rows = eventRepo.aggregateShopScores(now.minusDays(1), limit = 10)

        assertEquals(1, rows.size)
        assertEquals(shopId, rows[0].getShopId())
        assertEquals(4.0, rows[0].getScore())
        assertEquals(2L, rows[0].getEventCount())
    }

    @Test
    fun `existsByUserIdAndEventTypeAndShopId - detects recent duplicate`() {
        val shop = shopRepo.save(sampleShop("중복 매장"))
        val shopId = requireNotNull(shop.id)
        val now = LocalDateTime.now()
        eventRepo.save(
            popularityEvent(userId = 9L, shopId = shopId, type = PopularityEventType.SEARCH_AUTOCOMPLETE_SELECTED, at = now),
        )

        assertTrue(
            eventRepo.existsByUserIdAndEventTypeAndShopIdAndCreatedAtGreaterThanEqual(
                9L,
                PopularityEventType.SEARCH_AUTOCOMPLETE_SELECTED.name,
                shopId,
                now.minusMinutes(5),
            ),
        )
        assertFalse(
            eventRepo.existsByUserIdAndEventTypeAndShopIdAndCreatedAtGreaterThanEqual(
                9L,
                PopularityEventType.SEARCH_AUTOCOMPLETE_SELECTED.name,
                shopId,
                now.plusMinutes(1),
            ),
        )
    }

    @Test
    fun `aggregateKeywordScores - groups normalized keywords`() {
        val now = LocalDateTime.now()
        eventRepo.save(
            PopularityEventEntity(
                userId = 1L,
                eventType = PopularityEventType.SEARCH_KEYWORD_SUBMITTED.name,
                keyword = "원피스",
                keywordNormalized = "원피스",
                scope = "work",
                occurredAt = now,
            ),
        )
        eventRepo.save(
            PopularityEventEntity(
                userId = 2L,
                eventType = PopularityEventType.DISCOVERY_WORK_EXPLORE_ENTERED.name,
                workKeyword = "원피스",
                workKeywordNormalized = "원피스",
                occurredAt = now,
            ),
        )

        val rows = eventRepo.aggregateKeywordScores(now.minusDays(1), limit = 10)

        assertEquals(1, rows.size)
        assertEquals("원피스", rows[0].getKeyword())
        assertEquals(4.0, rows[0].getScore())
    }

    private fun sampleShop(name: String): ShopEntity =
        ShopEntity(
            name = name,
            address = "서울",
            px = BigDecimal("127.0"),
            py = BigDecimal("37.5"),
            status = ShopStatusEnum.active,
        )

    private fun popularityEvent(
        userId: Long,
        shopId: Long,
        type: PopularityEventType,
        at: LocalDateTime,
    ): PopularityEventEntity =
        PopularityEventEntity(
            userId = userId,
            eventType = type.name,
            shopId = shopId,
            occurredAt = at,
        )
}
