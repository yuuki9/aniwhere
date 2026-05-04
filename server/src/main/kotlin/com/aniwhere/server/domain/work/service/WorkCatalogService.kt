package com.aniwhere.server.domain.work.service

import com.aniwhere.server.domain.work.port.`in`.ListWorksUseCase
import com.aniwhere.server.domain.work.port.out.WorkCatalogPersistencePort
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
@Transactional(readOnly = true)
class WorkCatalogService(
    private val port: WorkCatalogPersistencePort,
) : ListWorksUseCase {

    override fun listWorks() = port.findAllOrderedByName()
}
