package com.aniwhere.server.adapter.out.persistence

import com.aniwhere.server.adapter.out.persistence.repository.CategoryRepository
import com.aniwhere.server.domain.category.port.out.CategoryCatalogPersistencePort
import org.springframework.stereotype.Component

@Component
class CategoryCatalogPersistenceAdapter(
    private val categoryRepository: CategoryRepository,
) : CategoryCatalogPersistencePort {

    override fun findAllWithShopCount() = categoryRepository.findAllWithShopCount()
}
