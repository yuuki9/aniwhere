package com.aniwhere.server.domain.popularity.service

import com.aniwhere.server.common.exception.BadRequestException
import com.aniwhere.server.domain.popularity.model.PopularityDiscoverySource
import com.aniwhere.server.domain.popularity.model.PopularityEventType
import com.aniwhere.server.domain.popularity.model.PopularitySearchScope
import com.aniwhere.server.domain.popularity.model.RecordPopularityEventCommand
import com.aniwhere.server.domain.popularity.port.out.PopularityPersistencePort
import io.mockk.every
import io.mockk.mockk
import io.mockk.verify
import org.junit.jupiter.api.Assertions.assertThrows
import org.junit.jupiter.api.Test
import java.time.LocalDateTime

class PopularityEventServiceTest {

    private val port = mockk<PopularityPersistencePort>(relaxed = true)
    private val service = PopularityEventService(port)

    @Test
    fun `recordEvent - saves when not duplicate`() {
        every { port.existsRecentDuplicate(any(), any()) } returns false
        every { port.existsShop(3L) } returns true

        service.recordEvent(
            RecordPopularityEventCommand(
                userId = 1L,
                type = PopularityEventType.SEARCH_AUTOCOMPLETE_SELECTED,
                occurredAt = LocalDateTime.now(),
                shopId = 3L,
            ),
        )

        verify { port.saveEvent(any()) }
    }

    @Test
    fun `recordEvent - skips save on duplicate`() {
        every { port.existsRecentDuplicate(any(), any()) } returns true
        every { port.existsShop(3L) } returns true

        service.recordEvent(
            RecordPopularityEventCommand(
                userId = 1L,
                type = PopularityEventType.SEARCH_AUTOCOMPLETE_SELECTED,
                occurredAt = LocalDateTime.now(),
                shopId = 3L,
            ),
        )

        verify(exactly = 0) { port.saveEvent(any()) }
    }

    @Test
    fun `recordEvent - keyword submit requires scope`() {
        assertThrows(BadRequestException::class.java) {
            service.recordEvent(
                RecordPopularityEventCommand(
                    userId = 1L,
                    type = PopularityEventType.SEARCH_KEYWORD_SUBMITTED,
                    occurredAt = LocalDateTime.now(),
                    keyword = "원피스",
                ),
            )
        }
    }

    @Test
    fun `recordEvent - autocomplete requires shop or work`() {
        assertThrows(BadRequestException::class.java) {
            service.recordEvent(
                RecordPopularityEventCommand(
                    userId = 1L,
                    type = PopularityEventType.SEARCH_AUTOCOMPLETE_SELECTED,
                    occurredAt = LocalDateTime.now(),
                ),
            )
        }
    }

    @Test
    fun `recordEvent - keyword submit with scope saves`() {
        every { port.existsRecentDuplicate(any(), any()) } returns false

        service.recordEvent(
            RecordPopularityEventCommand(
                userId = 1L,
                type = PopularityEventType.SEARCH_KEYWORD_SUBMITTED,
                occurredAt = LocalDateTime.now(),
                keyword = "원피스",
                scope = PopularitySearchScope.WORK,
            ),
        )

        verify { port.saveEvent(any()) }
    }

    @Test
    fun `recordEvent - discovery explore rejects both workId and workKeyword`() {
        assertThrows(BadRequestException::class.java) {
            service.recordEvent(
                RecordPopularityEventCommand(
                    userId = 1L,
                    type = PopularityEventType.DISCOVERY_WORK_EXPLORE_ENTERED,
                    occurredAt = LocalDateTime.now(),
                    workId = 1,
                    workKeyword = "원피스",
                ),
            )
        }
    }

    @Test
    fun `recordEvent - discovery click rejects multiple targets`() {
        assertThrows(BadRequestException::class.java) {
            service.recordEvent(
                RecordPopularityEventCommand(
                    userId = 1L,
                    type = PopularityEventType.DISCOVERY_RESULT_CLICKED,
                    occurredAt = LocalDateTime.now(),
                    source = PopularityDiscoverySource.SEARCH,
                    shopId = 3L,
                    workId = 1,
                ),
            )
        }
    }
}
