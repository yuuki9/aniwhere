package com.aniwhere.server.domain.favorite.service

import com.aniwhere.server.common.exception.BadRequestException
import com.aniwhere.server.common.exception.EntityNotFoundException
import com.aniwhere.server.domain.favorite.port.`in`.UserFavoriteUseCase
import com.aniwhere.server.domain.favorite.port.out.UserFavoritePersistencePort
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
@Transactional(readOnly = true)
class UserFavoriteService(
    private val port: UserFavoritePersistencePort,
) : UserFavoriteUseCase {

    @Transactional
    override fun addFavoriteWork(userId: Long, workId: Int) {
        validateIds(userId, workId.toLong(), "workId")
        if (!port.existsUser(userId)) throw EntityNotFoundException("User not found: $userId")
        if (!port.existsWork(workId)) throw EntityNotFoundException("Work not found: $workId")
        if (port.existsFavoriteWork(userId, workId)) return
        port.saveFavoriteWork(userId, workId)
    }

    @Transactional
    override fun removeFavoriteWork(userId: Long, workId: Int) {
        validateIds(userId, workId.toLong(), "workId")
        if (!port.existsUser(userId)) throw EntityNotFoundException("User not found: $userId")
        port.deleteFavoriteWork(userId, workId)
    }

    @Transactional
    override fun addFavoriteShop(userId: Long, shopId: Long) {
        validateIds(userId, shopId, "shopId")
        if (!port.existsUser(userId)) throw EntityNotFoundException("User not found: $userId")
        if (!port.existsShop(shopId)) throw EntityNotFoundException("Shop not found: $shopId")
        if (port.existsFavoriteShop(userId, shopId)) return
        port.saveFavoriteShop(userId, shopId)
    }

    @Transactional
    override fun removeFavoriteShop(userId: Long, shopId: Long) {
        validateIds(userId, shopId, "shopId")
        if (!port.existsUser(userId)) throw EntityNotFoundException("User not found: $userId")
        port.deleteFavoriteShop(userId, shopId)
    }

    private fun validateIds(userId: Long, targetId: Long, targetName: String) {
        if (userId <= 0) throw BadRequestException("userId must be positive")
        if (targetId <= 0) throw BadRequestException("$targetName must be positive")
    }
}
