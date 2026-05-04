package com.aniwhere.server.domain.work.port.out

import com.aniwhere.server.domain.work.model.WorkCatalogItem

fun interface WorkCatalogPersistencePort {

    fun findAllOrderedByName(): List<WorkCatalogItem>
}
