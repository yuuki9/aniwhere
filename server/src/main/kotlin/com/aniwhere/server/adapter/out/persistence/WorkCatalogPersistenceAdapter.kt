package com.aniwhere.server.adapter.out.persistence

import com.aniwhere.server.adapter.out.persistence.repository.WorkRepository
import com.aniwhere.server.domain.work.model.WorkCatalogItem
import com.aniwhere.server.domain.work.port.out.WorkCatalogPersistencePort
import org.springframework.data.domain.Sort
import org.springframework.stereotype.Component

@Component
class WorkCatalogPersistenceAdapter(
    private val workRepo: WorkRepository,
) : WorkCatalogPersistencePort {

    override fun findAllOrderedByName(): List<WorkCatalogItem> =
        workRepo.findAll(Sort.by(Sort.Direction.ASC, "name")).map { e ->
            WorkCatalogItem(id = checkNotNull(e.id) { "work id absent" }, name = e.name)
        }
}
