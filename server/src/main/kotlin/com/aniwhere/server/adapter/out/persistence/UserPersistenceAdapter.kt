package com.aniwhere.server.adapter.out.persistence

import com.aniwhere.server.adapter.out.persistence.entity.UserEntity
import com.aniwhere.server.adapter.out.persistence.repository.AdminRepository
import com.aniwhere.server.adapter.out.persistence.repository.UserRepository
import com.aniwhere.server.common.exception.EntityNotFoundException
import com.aniwhere.server.domain.user.model.UserAppRole
import com.aniwhere.server.domain.user.model.UserSummary
import com.aniwhere.server.domain.user.port.out.UserPersistencePort
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.repository.findByIdOrNull
import org.springframework.stereotype.Component
import org.springframework.transaction.annotation.Transactional

@Component
class UserPersistenceAdapter(
    private val userRepo: UserRepository,
    private val adminRepo: AdminRepository,
) : UserPersistencePort {
    override fun listUsers(keyword: String?, role: UserAppRole?, pageable: Pageable): Page<UserSummary> {
        val keywordRole = when (keyword?.uppercase()) {
            "ADMIN", "ROLE_ADMIN" -> UserAppRole.ADMIN.name
            "USER", "ROLE_USER" -> UserAppRole.USER.name
            else -> null
        }.takeIf { role == null }
        val usersPage = userRepo.searchUsers(keyword, keywordRole, role?.name, pageable)
        val userIds = usersPage.content.mapNotNull { it.id }
        val adminUserIds = adminRepo.findAllByUser_IdIn(userIds).mapNotNull { it.user.id }.toSet()

        return usersPage.map { user ->
            val userId = user.id ?: error("User id must not be null")
            user.toSummary(isAdmin = adminUserIds.contains(userId))
        }
    }

    override fun findUser(userId: Long): UserSummary? = userRepo.findByIdOrNull(userId)?.toSummary()

    override fun isNicknameTaken(nickname: String, excludeUserId: Long?): Boolean =
        if (excludeUserId == null) {
            userRepo.existsByNicknameIgnoreCase(nickname)
        } else {
            userRepo.existsByNicknameIgnoreCaseAndIdNot(nickname, excludeUserId)
        }

    @Transactional
    override fun updateNickname(userId: Long, nickname: String, emojiIconFilename: String?): UserSummary {
        val user = userRepo.findByIdOrNull(userId) ?: throw EntityNotFoundException("User not found: $userId")
        user.nickname = nickname
        user.emojiIconFilename = emojiIconFilename
        return userRepo.save(user).toSummary()
    }

    private fun UserEntity.toSummary(isAdmin: Boolean? = null): UserSummary {
        val userId = id ?: error("User id must not be null")
        val role = if (isAdmin ?: adminRepo.existsByUser_Id(userId)) "ROLE_ADMIN" else "ROLE_USER"
        return UserSummary(
            id = userId,
            userKey = userKey,
            nickname = nickname,
            emojiIconFilename = emojiIconFilename,
            status = status,
            role = role,
            lastLoginAt = lastLoginAt,
            createdAt = createdAt,
        )
    }
}
