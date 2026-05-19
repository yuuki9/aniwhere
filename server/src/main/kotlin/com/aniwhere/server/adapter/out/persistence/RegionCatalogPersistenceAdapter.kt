package com.aniwhere.server.adapter.out.persistence

import com.aniwhere.server.adapter.out.persistence.repository.RegionRepository
import com.aniwhere.server.domain.region.port.out.RegionCatalogPersistencePort
import org.springframework.stereotype.Component

@Component
class RegionCatalogPersistenceAdapter(
    private val regionRepository: RegionRepository,
) : RegionCatalogPersistencePort {

    override fun findAllWithShopCount() = regionRepository.findAllWithShopCount()
}
