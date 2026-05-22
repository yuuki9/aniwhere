package com.aniwhere.server.adapter.out.persistence.repository

import com.aniwhere.server.adapter.out.persistence.entity.UserFavoriteWorkEntity
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.repository.query.Param
import org.springframework.data.jpa.repository.Query

interface UserFavoriteWorkRepository : JpaRepository<UserFavoriteWorkEntity, Long> {
    @Query("select ufw from UserFavoriteWorkEntity ufw where ufw.user.id = :userId order by ufw.createdAt desc")
    fun findAllByUserIdOrderByCreatedAtDesc(@Param("userId") userId: Long): List<UserFavoriteWorkEntity>
}
