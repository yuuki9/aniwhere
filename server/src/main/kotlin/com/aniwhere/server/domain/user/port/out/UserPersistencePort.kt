package com.aniwhere.server.domain.user.port.out

import com.aniwhere.server.domain.user.model.UserSummary
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable

interface UserPersistencePort {
    fun listUsers(pageable: Pageable): Page<UserSummary>
    fun findUser(userId: Long): UserSummary?
    fun isNicknameTaken(nickname: String, excludeUserId: Long? = null): Boolean
    fun updateNickname(userId: Long, nickname: String): UserSummary
}
