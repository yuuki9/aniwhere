package com.aniwhere.server.domain.user.service

import com.aniwhere.server.common.exception.BadRequestException
import com.aniwhere.server.domain.user.model.UserAppRole
import com.aniwhere.server.domain.user.model.UserSummary
import com.aniwhere.server.domain.user.port.out.UserPersistencePort
import com.aniwhere.server.domain.auth.port.out.AuthPersistencePort
import io.mockk.every
import io.mockk.mockk
import io.mockk.verify
import org.hibernate.exception.ConstraintViolationException
import org.assertj.core.api.Assertions.assertThat
import org.assertj.core.api.Assertions.assertThatThrownBy
import org.junit.jupiter.api.Test
import org.springframework.dao.DataIntegrityViolationException
import java.sql.SQLException
import java.time.LocalDateTime

class UserServiceTest {
    private val persistence = mockk<UserPersistencePort>(relaxed = true)
    private val authPersistence = mockk<AuthPersistencePort>(relaxed = true)
    private val service = UserService(persistence, authPersistence)

    @Test
    fun `닉네임 unique 제약 위반이면 수정 실패`() {
        every { persistence.findUser(1L) } returns sampleUser(userId = 1L, nickname = "기존닉네임")
        every { persistence.updateNickname(1L, "중복닉네임", "emoji.png") } throws DataIntegrityViolationException(
            "duplicate key value violates unique constraint",
            ConstraintViolationException("duplicate key", SQLException("duplicate"), "uk_users_nickname_ci"),
        )

        assertThatThrownBy { service.updateNickname(1L, "중복닉네임", "emoji.png") }
            .isInstanceOf(BadRequestException::class.java)
            .hasMessageContaining("이미 사용 중인 닉네임")
    }

    @Test
    fun `닉네임 수정 성공`() {
        every { persistence.findUser(1L) } returns sampleUser(userId = 1L, nickname = null)
        every {
            persistence.updateNickname(1L, "새닉네임", "mashiro.png")
        } returns sampleUser(userId = 1L, nickname = "새닉네임", emojiIconFilename = "mashiro.png")

        val result = service.updateNickname(1L, "  새닉네임 ", "  mashiro.png ")

        assertThat(result.nickname).isEqualTo("새닉네임")
        assertThat(result.emojiIconFilename).isEqualTo("mashiro.png")
        verify { persistence.updateNickname(1L, "새닉네임", "mashiro.png") }
    }

    @Test
    fun `이모지 파일명에 경로가 포함되면 실패`() {
        every { persistence.findUser(1L) } returns sampleUser(userId = 1L, nickname = null)

        assertThatThrownBy { service.updateNickname(1L, "닉네임", "emoji/mashiro.png") }
            .isInstanceOf(BadRequestException::class.java)
            .hasMessageContaining("filename only")
    }

    @Test
    fun `내 닉네임이면 중복 검사 사용 가능`() {
        every { persistence.findUser(1L) } returns sampleUser(userId = 1L, nickname = "내닉네임")
        every { persistence.isNicknameTaken("내닉네임", 1L) } returns false

        val result = service.checkNicknameAvailability(1L, "내닉네임")

        assertThat(result.available).isTrue()
    }

    @Test
    fun `내 프로필 조회 성공`() {
        every { persistence.findUser(2L) } returns sampleUser(userId = 2L, nickname = "프로필닉")

        val result = service.getMyProfile(2L)

        assertThat(result.id).isEqualTo(2L)
        assertThat(result.nickname).isEqualTo("프로필닉")
    }

    @Test
    fun `회원 상세 조회 성공`() {
        every { persistence.findUser(3L) } returns sampleUser(userId = 3L, nickname = "상세닉")

        val result = service.getUserDetail(3L)

        assertThat(result.id).isEqualTo(3L)
        assertThat(result.nickname).isEqualTo("상세닉")
    }

    @Test
    fun `관리자 권한 부여 시 refresh 토큰을 폐기한다`() {
        every { persistence.findUser(2L) } returnsMany
            listOf(
                sampleUser(userId = 2L, nickname = "대상", role = "ROLE_USER"),
                sampleUser(userId = 2L, nickname = "대상", role = "ROLE_ADMIN"),
            )

        val result = service.updateUserRole(actorUserId = 1L, targetUserId = 2L, role = UserAppRole.ADMIN)

        assertThat(result.role).isEqualTo("ROLE_ADMIN")
        verify { authPersistence.grantAdmin(2L) }
        verify { authPersistence.revokeAllRefreshTokens(2L) }
    }

    @Test
    fun `자신의 관리자 권한은 해제할 수 없다`() {
        every { persistence.findUser(1L) } returns sampleUser(userId = 1L, nickname = "관리자", role = "ROLE_ADMIN")

        assertThatThrownBy { service.updateUserRole(actorUserId = 1L, targetUserId = 1L, role = UserAppRole.USER) }
            .isInstanceOf(BadRequestException::class.java)
            .hasMessageContaining("자신의 관리자 권한")
    }

    private fun sampleUser(
        userId: Long,
        nickname: String?,
        role: String = "ROLE_USER",
        emojiIconFilename: String? = null,
    ) =
        UserSummary(
            id = userId,
            userKey = 443731104L,
            nickname = nickname,
            emojiIconFilename = emojiIconFilename,
            status = "ACTIVE",
            role = role,
            lastLoginAt = null,
            createdAt = LocalDateTime.now(),
        )
}
