package com.aniwhere.server.adapter.out.persistence

import com.aniwhere.server.adapter.out.persistence.entity.UserEntity
import com.aniwhere.server.adapter.out.persistence.repository.AdminRepository
import com.aniwhere.server.adapter.out.persistence.repository.UserRepository
import com.aniwhere.server.common.exception.EntityNotFoundException
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
    override fun listUsers(pageable: Pageable): Page<UserSummary> = userRepo.findAll(pageable).map { it.toSummary() }

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

    private fun UserEntity.toSummary(): UserSummary {
        val userId = id ?: error("User id must not be null")
        val role = if (adminRepo.existsByUser_Id(userId)) "ROLE_ADMIN" else "ROLE_USER"
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
