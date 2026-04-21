package com.aniwhere.server.adapter.out.persistence.mapper

import com.aniwhere.server.adapter.out.persistence.entity.*
import com.aniwhere.server.domain.shop.model.*

object ShopMapper {
    fun toDomain(e: ShopEntity) = Shop(
        id = e.id,
        name = e.name,
        address = e.address,
        px = e.px,
        py = e.py,
        floor = e.floor,
        regionId = e.region?.id,
        regionName = e.region?.name,
        status = ShopStatus.valueOf(e.status.name.uppercase()),
        sellsIchibanKuji = e.sellsIchibanKuji,
        visitTip = e.visitTip,
        categories = e.categories.map { it.name },
        works = e.works.map { it.name },
        links = e.links.map { ShopLink(it.id, LinkType.valueOf(it.type.name.uppercase()), it.url) },
        description = e.detail?.description,
        createdAt = e.createdAt,
        updatedAt = e.updatedAt,
    )
}
