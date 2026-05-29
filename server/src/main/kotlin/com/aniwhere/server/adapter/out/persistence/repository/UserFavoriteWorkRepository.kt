package com.aniwhere.server.adapter.out.persistence.repository

import com.aniwhere.server.adapter.out.persistence.entity.UserFavoriteWorkEntity
import com.aniwhere.server.adapter.out.persistence.entity.UserFavoriteShopEntity
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.repository.query.Param
import org.springframework.data.jpa.repository.Query

interface UserFavoriteWorkRepository : JpaRepository<UserFavoriteWorkEntity, Long> {
    @Query("select ufw from UserFavoriteWorkEntity ufw where ufw.user.id = :userId order by ufw.createdAt desc, ufw.id desc")
    fun findAllByUserIdOrderByCreatedAtDesc(@Param("userId") userId: Long): List<UserFavoriteWorkEntity>
    fun existsByUser_IdAndWorkId(userId: Long, workId: Int): Boolean
    fun deleteByUser_IdAndWorkId(userId: Long, workId: Int): Long
}

interface UserFavoriteShopRepository : JpaRepository<UserFavoriteShopEntity, Long> {
    @Query("select ufs from UserFavoriteShopEntity ufs where ufs.user.id = :userId order by ufs.createdAt desc, ufs.id desc")
    fun findAllByUserIdOrderByCreatedAtDesc(@Param("userId") userId: Long): List<UserFavoriteShopEntity>
    fun existsByUser_IdAndShopId(userId: Long, shopId: Long): Boolean
    fun deleteByUser_IdAndShopId(userId: Long, shopId: Long): Long
}
