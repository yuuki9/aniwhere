package com.aniwhere.server.domain.search.service

import com.aniwhere.server.common.exception.BadRequestException
import com.aniwhere.server.domain.search.model.SearchAutocompleteItem
import com.aniwhere.server.domain.search.model.SearchAutocompleteKind
import com.aniwhere.server.domain.search.model.SearchAutocompleteScope
import com.aniwhere.server.domain.search.port.out.SearchAutocompletePersistencePort
import io.mockk.every
import io.mockk.mockk
import io.mockk.verify
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertThrows
import org.junit.jupiter.api.Test

class SearchAutocompleteServiceTest {

    private val port = mockk<SearchAutocompletePersistencePort>()
    private val service = SearchAutocompleteService(port)

    @Test
    fun `autocomplete shop - trims query and caps limit`() {
        val expected = listOf(
            SearchAutocompleteItem(label = "원피스 굿즈", kind = SearchAutocompleteKind.SHOP, shopId = 1L),
        )
        every { port.suggestShops("원", 20) } returns expected

        val result = service.autocomplete("  원  ", SearchAutocompleteScope.SHOP, limit = 99)

        assertEquals(expected, result.items)
        verify { port.suggestShops("원", 20) }
    }

    @Test
    fun `autocomplete shop - escapes wildcards once before port`() {
        every { port.suggestShops("100\\%", 8) } returns emptyList()

        service.autocomplete("100%", SearchAutocompleteScope.SHOP, limit = 8)

        verify(exactly = 1) { port.suggestShops("100\\%", 8) }
    }

    @Test
    fun `autocomplete work - delegates to port`() {
        val expected = listOf(
            SearchAutocompleteItem(label = "원피스", kind = SearchAutocompleteKind.WORK, workId = 2),
        )
        every { port.suggestWorks("piece", 5) } returns expected

        val result = service.autocomplete("piece", SearchAutocompleteScope.WORK, limit = 5)

        assertEquals(expected, result.items)
        verify { port.suggestWorks("piece", 5) }
    }

    @Test
    fun `autocomplete - rejects blank query`() {
        assertThrows(BadRequestException::class.java) {
            service.autocomplete("   ", SearchAutocompleteScope.SHOP, limit = 8)
        }
    }

    @Test
    fun `autocomplete - rejects query over max length`() {
        assertThrows(BadRequestException::class.java) {
            service.autocomplete("a".repeat(51), SearchAutocompleteScope.SHOP, limit = 8)
        }
    }
}
