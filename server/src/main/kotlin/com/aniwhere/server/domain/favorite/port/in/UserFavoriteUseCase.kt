package com.aniwhere.server.domain.favorite.port.`in`

import com.aniwhere.server.domain.shop.model.Shop

interface UserFavoriteUseCase {
    fun listFavoriteShops(userId: Long): List<Shop>
    fun addFavoriteWork(userId: Long, workId: Int)
    fun removeFavoriteWork(userId: Long, workId: Int)
    fun addFavoriteShop(userId: Long, shopId: Long)
    fun removeFavoriteShop(userId: Long, shopId: Long)
}
