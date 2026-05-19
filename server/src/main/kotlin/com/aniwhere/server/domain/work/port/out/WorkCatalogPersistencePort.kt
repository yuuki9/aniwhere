package com.aniwhere.server.domain.work.port.out

import com.aniwhere.server.domain.work.model.WorkCatalogItem
import com.aniwhere.server.domain.work.model.WorkType

fun interface WorkCatalogPersistencePort {

    fun findAllOrderedByPopularityDesc(type: WorkType?): List<WorkCatalogItem>
}
