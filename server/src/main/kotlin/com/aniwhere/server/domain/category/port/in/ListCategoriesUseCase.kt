package com.aniwhere.server.domain.category.port.`in`

import com.aniwhere.server.domain.category.model.CategoryListItem

fun interface ListCategoriesUseCase {

    fun listCategories(): List<CategoryListItem>
}
