package com.aniwhere.server.adapter.out.persistence.mapper

import com.aniwhere.server.adapter.out.persistence.entity.*
import com.aniwhere.server.config.ShopImagesS3Properties
import com.aniwhere.server.domain.shop.model.*
import org.springframework.stereotype.Component

@Component
class ShopMapper(
    private val shopImagesS3: ShopImagesS3Properties,
) {
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
        images = e.images
            .sortedWith(compareBy({ if (it.role == ShopImageRoleEnum.primary) 0 else 1 }, { it.sortOrder }))
            .map {
                ShopImage(
                    id = it.id,
                    url = shopImagesS3.resolvePublicUrl(it.s3Key),
                    role = ShopImageRole.valueOf(it.role.name.uppercase()),
                    sortOrder = it.sortOrder,
                )
            },
        description = e.detail?.description,
        createdAt = e.createdAt,
        updatedAt = e.updatedAt,
    )
}
