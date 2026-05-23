package com.aniwhere.server.domain.favorite.port.`in`

interface UserFavoriteUseCase {
    fun addFavoriteWork(userId: Long, workId: Int)
    fun removeFavoriteWork(userId: Long, workId: Int)
    fun addFavoriteShop(userId: Long, shopId: Long)
    fun removeFavoriteShop(userId: Long, shopId: Long)
}
