package com.aniwhere.server.adapter.out.persistence

import com.aniwhere.server.adapter.out.persistence.entity.FavoriteWorkSource
import com.aniwhere.server.adapter.out.persistence.entity.UserFavoriteShopEntity
import com.aniwhere.server.adapter.out.persistence.entity.UserFavoriteWorkEntity
import com.aniwhere.server.adapter.out.persistence.mapper.ShopMapper
import com.aniwhere.server.adapter.out.persistence.repository.ShopRepository
import com.aniwhere.server.adapter.out.persistence.repository.UserFavoriteShopRepository
import com.aniwhere.server.adapter.out.persistence.repository.UserFavoriteWorkRepository
import com.aniwhere.server.adapter.out.persistence.repository.UserRepository
import com.aniwhere.server.adapter.out.persistence.repository.WorkRepository
import com.aniwhere.server.domain.favorite.port.out.UserFavoritePersistencePort
import com.aniwhere.server.domain.shop.model.Shop
import org.springframework.data.repository.findByIdOrNull
import org.springframework.stereotype.Component

@Component
class UserFavoritePersistenceAdapter(
    private val userRepo: UserRepository,
    private val workRepo: WorkRepository,
    private val shopRepo: ShopRepository,
    private val favoriteWorkRepo: UserFavoriteWorkRepository,
    private val favoriteShopRepo: UserFavoriteShopRepository,
    private val shopMapper: ShopMapper,
) : UserFavoritePersistencePort {

    override fun existsUser(userId: Long): Boolean = userRepo.existsById(userId)
    override fun existsWork(workId: Int): Boolean = workRepo.existsById(workId)
    override fun existsShop(shopId: Long): Boolean = shopRepo.existsById(shopId)

    override fun findFavoriteShops(userId: Long): List<Shop> {
        val favoriteShopIds = favoriteShopRepo.findAllByUserIdOrderByCreatedAtDesc(userId).map { it.shopId }
        if (favoriteShopIds.isEmpty()) return emptyList()
        val shopsById = shopRepo.findAllById(favoriteShopIds).associateBy { it.id }
        return favoriteShopIds.mapNotNull { shopId ->
            shopsById[shopId]?.let(shopMapper::toDomain)
        }
    }

    override fun existsFavoriteWork(userId: Long, workId: Int): Boolean =
        favoriteWorkRepo.existsByUser_IdAndWorkId(userId, workId)

    override fun saveFavoriteWork(userId: Long, workId: Int) {
        val user = userRepo.findByIdOrNull(userId) ?: return
        favoriteWorkRepo.save(
            UserFavoriteWorkEntity(
                user = user,
                workId = workId,
                source = FavoriteWorkSource.MANUAL,
            ),
        )
    }

    override fun deleteFavoriteWork(userId: Long, workId: Int): Boolean =
        favoriteWorkRepo.deleteByUser_IdAndWorkId(userId, workId) > 0

    override fun existsFavoriteShop(userId: Long, shopId: Long): Boolean =
        favoriteShopRepo.existsByUser_IdAndShopId(userId, shopId)

    override fun saveFavoriteShop(userId: Long, shopId: Long) {
        val user = userRepo.findByIdOrNull(userId) ?: return
        favoriteShopRepo.save(
            UserFavoriteShopEntity(
                user = user,
                shopId = shopId,
            ),
        )
    }

    override fun deleteFavoriteShop(userId: Long, shopId: Long): Boolean =
        favoriteShopRepo.deleteByUser_IdAndShopId(userId, shopId) > 0
}
