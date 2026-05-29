package com.aniwhere.server.domain.user.service

import com.aniwhere.server.common.exception.BadRequestException
import com.aniwhere.server.common.exception.EntityNotFoundException
import com.aniwhere.server.domain.auth.port.out.AuthPersistencePort
import com.aniwhere.server.domain.user.model.NicknameAvailabilityResult
import com.aniwhere.server.domain.user.model.UserAppRole
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
    private val authPersistence: AuthPersistencePort,
) : UserUseCase {
    override fun listUsers(pageable: Pageable): Page<UserSummary> = persistence.listUsers(pageable)

    override fun getMyProfile(userId: Long): UserSummary = getExistingUser(userId)

    override fun getUserDetail(userId: Long): UserSummary = getExistingUser(userId)

    @Transactional
    override fun updateNickname(userId: Long, nickname: String, emojiIconFilename: String?): UserSummary {
        val user = getExistingUser(userId)
        val normalized = normalizeNickname(nickname)
        val normalizedEmojiIconFilename = normalizeEmojiIconFilename(emojiIconFilename)
        try {
            return persistence.updateNickname(user.id, normalized, normalizedEmojiIconFilename)
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

    @Transactional
    override fun updateUserRole(actorUserId: Long, targetUserId: Long, role: UserAppRole): UserSummary {
        val targetUser = getExistingUser(targetUserId)
        val currentRole = UserAppRole.fromSecurityRole(targetUser.role)
        if (currentRole == role) {
            return targetUser
        }
        if (actorUserId == targetUserId && role == UserAppRole.USER) {
            throw BadRequestException("자신의 관리자 권한은 해제할 수 없습니다.")
        }

        when (role) {
            UserAppRole.ADMIN -> authPersistence.grantAdmin(targetUserId)
            UserAppRole.USER -> authPersistence.revokeAdmin(targetUserId)
        }
        authPersistence.revokeAllRefreshTokens(targetUserId)
        return getExistingUser(targetUserId)
    }

    private fun normalizeNickname(raw: String): String {
        val normalized = raw.trim()
        if (normalized.isBlank()) throw BadRequestException("nickname must not be blank")
        if (normalized.length > 50) throw BadRequestException("nickname must be at most 50 characters")
        return normalized
    }

    private fun normalizeEmojiIconFilename(raw: String?): String? {
        val normalized = raw?.trim() ?: return null
        if (normalized.isBlank()) throw BadRequestException("emojiIconFilename must not be blank")
        if (normalized.length > 255) throw BadRequestException("emojiIconFilename must be at most 255 characters")
        if (normalized.contains("/") || normalized.contains("\\")) {
            throw BadRequestException("emojiIconFilename must be a filename only")
        }
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
