package com.aniwhere.server.domain.work.port.`in`

import com.aniwhere.server.domain.work.model.WorkCatalogItem

fun interface ListWorksUseCase {

    fun listWorks(): List<WorkCatalogItem>
}
