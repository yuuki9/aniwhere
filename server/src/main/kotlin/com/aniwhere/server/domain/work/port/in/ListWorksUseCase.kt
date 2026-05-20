package com.aniwhere.server.domain.work.port.`in`

import com.aniwhere.server.domain.work.model.WorkCatalogItem
import com.aniwhere.server.domain.work.model.WorkType

fun interface ListWorksUseCase {

    fun listWorks(type: WorkType?): List<WorkCatalogItem>
}
