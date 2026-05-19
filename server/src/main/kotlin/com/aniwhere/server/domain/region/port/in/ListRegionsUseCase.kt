package com.aniwhere.server.domain.region.port.`in`

import com.aniwhere.server.domain.region.model.RegionListItem

fun interface ListRegionsUseCase {

    fun listRegions(): List<RegionListItem>
}
