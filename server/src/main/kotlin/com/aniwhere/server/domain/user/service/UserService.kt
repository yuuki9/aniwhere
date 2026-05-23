package com.aniwhere.server.domain.user.service

import com.aniwhere.server.common.exception.BadRequestException
import com.aniwhere.server.common.exception.EntityNotFoundException
import com.aniwhere.server.domain.user.model.NicknameAvailabilityResult
import com.aniwhere.server.domain.user.model.UserSummary
import com.aniwhere.server.domain.user.port.`in`.UserUseCase
import com.aniwhere.server.domain.user.port.out.UserPersistencePort
import org.hibernate.exception.ConstraintViolationException
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.dao.DataIntegrityViolationException
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
class UserService(
    private val persistence: UserPersistencePort,
) : UserUseCase {
    override fun listUsers(pageable: Pageable): Page<UserSummary> = persistence.listUsers(pageable)

    override fun getMyProfile(userId: Long): UserSummary = getExistingUser(userId)

    override fun getUserDetail(userId: Long): UserSummary = getExistingUser(userId)

    @Transactional
    override fun updateNickname(userId: Long, nickname: String): UserSummary {
        val user = getExistingUser(userId)
        val normalized = normalizeNickname(nickname)
        try {
            return persistence.updateNickname(user.id, normalized)
        } catch (e: DataIntegrityViolationException) {
            if (isNicknameUniqueViolation(e)) {
                throw BadRequestException("이미 사용 중인 닉네임입니다.")
            }
            throw e
        }
    }

    override fun checkNicknameAvailability(requesterUserId: Long?, nickname: String): NicknameAvailabilityResult {
        val normalized = normalizeNickname(nickname)
        val available = persistence.isNicknameTaken(normalized, requesterUserId).not()
        return NicknameAvailabilityResult(normalized, available)
    }

    private fun normalizeNickname(raw: String): String {
        val normalized = raw.trim()
        if (normalized.isBlank()) throw BadRequestException("nickname must not be blank")
        if (normalized.length > 50) throw BadRequestException("nickname must be at most 50 characters")
        return normalized
    }

    private fun getExistingUser(userId: Long): UserSummary =
        persistence.findUser(userId) ?: throw EntityNotFoundException("User not found: $userId")

    private fun isNicknameUniqueViolation(e: DataIntegrityViolationException): Boolean {
        var cause: Throwable? = e
        while (cause != null) {
            if (cause is ConstraintViolationException) {
                val constraintName = cause.constraintName?.lowercase().orEmpty()
                if (constraintName.contains("nickname")) {
                    return true
                }
            }
            cause = cause.cause
        }
        val normalizedMessage = e.message?.lowercase().orEmpty()
        return normalizedMessage.contains("nickname") &&
            (normalizedMessage.contains("unique") || normalizedMessage.contains("duplicate"))
    }
}
