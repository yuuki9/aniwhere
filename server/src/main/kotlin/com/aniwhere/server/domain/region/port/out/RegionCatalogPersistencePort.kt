package com.aniwhere.server.domain.region.port.out

import com.aniwhere.server.domain.region.model.RegionListItem

fun interface RegionCatalogPersistencePort {

    fun findAllWithShopCount(): List<RegionListItem>
}
