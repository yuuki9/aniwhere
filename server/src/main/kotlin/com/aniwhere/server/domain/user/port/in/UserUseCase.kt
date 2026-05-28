package com.aniwhere.server.domain.user.port.`in`

import com.aniwhere.server.domain.user.model.NicknameAvailabilityResult
import com.aniwhere.server.domain.user.model.UserAppRole
import com.aniwhere.server.domain.user.model.UserSummary
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable

interface UserUseCase {
    fun listUsers(pageable: Pageable): Page<UserSummary>
    fun getMyProfile(userId: Long): UserSummary
    fun getUserDetail(userId: Long): UserSummary
    fun updateNickname(userId: Long, nickname: String): UserSummary
    fun checkNicknameAvailability(requesterUserId: Long?, nickname: String): NicknameAvailabilityResult
    fun updateUserRole(actorUserId: Long, targetUserId: Long, role: UserAppRole): UserSummary
}
