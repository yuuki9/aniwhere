package com.aniwhere.server.domain.favorite.port.out

interface UserFavoritePersistencePort {
    fun existsUser(userId: Long): Boolean
    fun existsWork(workId: Int): Boolean
    fun existsShop(shopId: Long): Boolean

    fun existsFavoriteWork(userId: Long, workId: Int): Boolean
    fun saveFavoriteWork(userId: Long, workId: Int)
    fun deleteFavoriteWork(userId: Long, workId: Int): Boolean

    fun existsFavoriteShop(userId: Long, shopId: Long): Boolean
    fun saveFavoriteShop(userId: Long, shopId: Long)
    fun deleteFavoriteShop(userId: Long, shopId: Long): Boolean
}
