package com.aniwhere.server.domain.category.port.out

import com.aniwhere.server.domain.category.model.CategoryListItem

fun interface CategoryCatalogPersistencePort {

    fun findAllWithShopCount(): List<CategoryListItem>
}
