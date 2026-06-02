package com.aniwhere.server.adapter.`in`.web

import com.aniwhere.server.domain.search.model.SearchAutocompleteItem
import com.aniwhere.server.domain.search.model.SearchAutocompleteKind
import com.aniwhere.server.domain.search.model.SearchAutocompleteResponse
import com.aniwhere.server.domain.search.model.SearchAutocompleteScope
import com.aniwhere.server.domain.search.port.`in`.SearchAutocompleteUseCase
import com.ninjasquad.springmockk.MockkBean
import io.mockk.every
import io.mockk.verify
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.status

@WebMvcTest(SearchController::class)
@AutoConfigureMockMvc(addFilters = false)
class SearchControllerTest {

    @Autowired
    private lateinit var mvc: MockMvc

    @MockkBean
    private lateinit var autocompleteUseCase: SearchAutocompleteUseCase

    @Test
    fun `GET search_autocomplete shop scope`() {
        every {
            autocompleteUseCase.autocomplete("원", SearchAutocompleteScope.SHOP, 8)
        } returns SearchAutocompleteResponse(
            items = listOf(
                SearchAutocompleteItem(label = "원피스 굿즈", kind = SearchAutocompleteKind.SHOP, shopId = 3L),
            ),
        )

        mvc.perform(
            get("/api/v1/search/autocomplete")
                .param("q", "원")
                .param("scope", "shop"),
        )
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.success").value(true))
            .andExpect(jsonPath("$.data.items[0].label").value("원피스 굿즈"))
            .andExpect(jsonPath("$.data.items[0].kind").value("SHOP"))
            .andExpect(jsonPath("$.data.items[0].shopId").value(3))

        verify { autocompleteUseCase.autocomplete("원", SearchAutocompleteScope.SHOP, 8) }
    }

    @Test
    fun `GET search_autocomplete work scope passes custom limit`() {
        every {
            autocompleteUseCase.autocomplete("주술", SearchAutocompleteScope.WORK, 5)
        } returns SearchAutocompleteResponse(
            items = listOf(
                SearchAutocompleteItem(label = "주술회전", kind = SearchAutocompleteKind.WORK, workId = 7),
            ),
        )

        mvc.perform(
            get("/api/v1/search/autocomplete")
                .param("q", "주술")
                .param("scope", "work")
                .param("limit", "5"),
        )
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.data.items[0].kind").value("WORK"))
            .andExpect(jsonPath("$.data.items[0].workId").value(7))

        verify { autocompleteUseCase.autocomplete("주술", SearchAutocompleteScope.WORK, 5) }
    }
}
