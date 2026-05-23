package com.aniwhere.server.domain.user.service

import com.aniwhere.server.common.exception.BadRequestException
import com.aniwhere.server.domain.user.model.UserSummary
import com.aniwhere.server.domain.user.port.out.UserPersistencePort
import io.mockk.every
import io.mockk.mockk
import io.mockk.verify
import org.assertj.core.api.Assertions.assertThat
import org.assertj.core.api.Assertions.assertThatThrownBy
import org.junit.jupiter.api.Test
import java.time.LocalDateTime

class UserServiceTest {
    private val persistence = mockk<UserPersistencePort>(relaxed = true)
    private val service = UserService(persistence)

    @Test
    fun `닉네임 중복이면 수정 실패`() {
        every { persistence.findUser(1L) } returns sampleUser(userId = 1L, nickname = "기존닉네임")
        every { persistence.isNicknameTaken("중복닉네임", 1L) } returns true

        assertThatThrownBy { service.updateNickname(1L, "중복닉네임") }
            .isInstanceOf(BadRequestException::class.java)
            .hasMessageContaining("이미 사용 중인 닉네임")
    }

    @Test
    fun `닉네임 수정 성공`() {
        every { persistence.findUser(1L) } returns sampleUser(userId = 1L, nickname = null)
        every { persistence.isNicknameTaken("새닉네임", 1L) } returns false
        every { persistence.updateNickname(1L, "새닉네임") } returns sampleUser(userId = 1L, nickname = "새닉네임")

        val result = service.updateNickname(1L, "  새닉네임 ")

        assertThat(result.nickname).isEqualTo("새닉네임")
        verify { persistence.updateNickname(1L, "새닉네임") }
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

    private fun sampleUser(userId: Long, nickname: String?) =
        UserSummary(
            id = userId,
            userKey = 443731104L,
            nickname = nickname,
            status = "ACTIVE",
            lastLoginAt = null,
            createdAt = LocalDateTime.now(),
        )
}
