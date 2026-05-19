package com.aniwhere.server.domain.region.service

import com.aniwhere.server.domain.region.port.`in`.ListRegionsUseCase
import com.aniwhere.server.domain.region.port.out.RegionCatalogPersistencePort
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
@Transactional(readOnly = true)
class RegionCatalogService(
    private val port: RegionCatalogPersistencePort,
) : ListRegionsUseCase {

    override fun listRegions() = port.findAllWithShopCount()
}
