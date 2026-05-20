package com.aniwhere.server.adapter.`in`.web

import com.aniwhere.server.domain.category.model.CategoryListItem
import com.aniwhere.server.domain.category.port.`in`.ListCategoriesUseCase
import com.ninjasquad.springmockk.MockkBean
import io.mockk.every
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.status

@WebMvcTest(CategoryController::class)
@AutoConfigureMockMvc(addFilters = false)
class CategoryControllerTest {

    @Autowired
    private lateinit var mvc: MockMvc

    @MockkBean
    private lateinit var useCase: ListCategoriesUseCase

    @Test
    fun `GET categories - 카테고리 목록과 count`() {
        every { useCase.listCategories() } returns listOf(
            CategoryListItem(id = 1, name = "피규어", count = 8),
            CategoryListItem(id = 2, name = "굿즈", count = 0),
        )
        mvc.perform(get("/api/v1/categories"))
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.success").value(true))
            .andExpect(jsonPath("$.data.length()").value(2))
            .andExpect(jsonPath("$.data[0].id").value(1))
            .andExpect(jsonPath("$.data[0].name").value("피규어"))
            .andExpect(jsonPath("$.data[0].count").value(8))
            .andExpect(jsonPath("$.data[1].count").value(0))
    }
}
