package com.aniwhere.server.adapter.`in`.web

import com.aniwhere.server.config.security.SecurityPrincipal
import com.aniwhere.server.domain.user.model.NicknameAvailabilityResult
import com.aniwhere.server.domain.user.model.UserSummary
import com.aniwhere.server.domain.user.port.`in`.UserUseCase
import com.fasterxml.jackson.databind.ObjectMapper
import com.ninjasquad.springmockk.MockkBean
import io.mockk.every
import io.mockk.verify
import org.junit.jupiter.api.AfterEach
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest
import org.springframework.data.domain.PageImpl
import org.springframework.http.MediaType
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken
import org.springframework.security.core.authority.SimpleGrantedAuthority
import org.springframework.security.core.context.SecurityContextHolder
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.status
import java.time.LocalDateTime

@WebMvcTest(UserController::class)
@AutoConfigureMockMvc(addFilters = false)
class UserControllerTest {
    @Autowired
    private lateinit var mvc: MockMvc

    @Autowired
    private lateinit var mapper: ObjectMapper

    @MockkBean
    private lateinit var userUseCase: UserUseCase

    @AfterEach
    fun clearContext() {
        SecurityContextHolder.clearContext()
    }

    @Test
    fun `GET users - 회원 목록 조회`() {
        mockAuthenticatedUser(10L, "ROLE_ADMIN")
        every { userUseCase.listUsers(any()) } returns PageImpl(listOf(sampleUser(10L, "닉네임")))

        mvc.perform(get("/api/v1/users"))
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.data.content[0].nickname").value("닉네임"))
    }

    @Test
    fun `GET users_me - 내 상세 조회`() {
        mockAuthenticatedUser(10L, "ROLE_USER")
        every { userUseCase.getMyProfile(10L) } returns sampleUser(10L, "내닉네임")

        mvc.perform(get("/api/v1/users/me"))
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.data.id").value(10))
            .andExpect(jsonPath("$.data.nickname").value("내닉네임"))
    }

    @Test
    fun `GET users_{id} - 회원 상세 조회`() {
        mockAuthenticatedUser(1L, "ROLE_ADMIN")
        every { userUseCase.getUserDetail(11L) } returns sampleUser(11L, "상세닉네임")

        mvc.perform(get("/api/v1/users/11"))
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.data.id").value(11))
            .andExpect(jsonPath("$.data.nickname").value("상세닉네임"))
    }

    @Test
    fun `GET users_nickname_availability - 닉네임 사용 가능 여부`() {
        mockAuthenticatedUser(10L, "ROLE_USER")
        every { userUseCase.checkNicknameAvailability(10L, "새닉네임") } returns NicknameAvailabilityResult(
            nickname = "새닉네임",
            available = true,
        )

        mvc.perform(get("/api/v1/users/nickname/availability").param("nickname", "새닉네임"))
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.data.available").value(true))
    }

    @Test
    fun `PATCH users_me_nickname - 내 닉네임 수정`() {
        mockAuthenticatedUser(10L, "ROLE_USER")
        every { userUseCase.updateNickname(10L, "새닉네임", "mashiro.png") } returns sampleUser(10L, "새닉네임", "mashiro.png")

        mvc.perform(
            patch("/api/v1/users/me/nickname")
                .contentType(MediaType.APPLICATION_JSON)
                .content(
                    mapper.writeValueAsString(
                        UpdateNicknameRequest(
                            nickname = "새닉네임",
                            emojiIconFilename = "mashiro.png",
                        ),
                    ),
                ),
        )
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.data.nickname").value("새닉네임"))
            .andExpect(jsonPath("$.data.emojiIconFilename").value("mashiro.png"))

        verify { userUseCase.updateNickname(10L, "새닉네임", "mashiro.png") }
    }

    private fun sampleUser(userId: Long, nickname: String?, emojiIconFilename: String? = null) =
        UserSummary(
            id = userId,
            userKey = 443731104L,
            nickname = nickname,
            emojiIconFilename = emojiIconFilename,
            status = "ACTIVE",
            role = "ROLE_USER",
            lastLoginAt = null,
            createdAt = LocalDateTime.now(),
        )

    private fun mockAuthenticatedUser(userId: Long, role: String) {
        val principal = SecurityPrincipal(userId = userId, role = role)
        val auth = UsernamePasswordAuthenticationToken(principal, null, listOf(SimpleGrantedAuthority(role)))
        SecurityContextHolder.getContext().authentication = auth
    }
}
