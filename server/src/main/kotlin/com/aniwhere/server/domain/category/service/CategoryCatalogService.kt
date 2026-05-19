package com.aniwhere.server.domain.category.service

import com.aniwhere.server.domain.category.port.`in`.ListCategoriesUseCase
import com.aniwhere.server.domain.category.port.out.CategoryCatalogPersistencePort
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
@Transactional(readOnly = true)
class CategoryCatalogService(
    private val port: CategoryCatalogPersistencePort,
) : ListCategoriesUseCase {

    override fun listCategories() = port.findAllWithShopCount()
}
