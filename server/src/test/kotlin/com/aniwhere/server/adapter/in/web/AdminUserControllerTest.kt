package com.aniwhere.server.adapter.`in`.web

import com.aniwhere.server.config.security.SecurityPrincipal
import com.aniwhere.server.domain.user.model.UserAppRole
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
import org.springframework.http.MediaType
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken
import org.springframework.security.core.authority.SimpleGrantedAuthority
import org.springframework.security.core.context.SecurityContextHolder
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.status
import java.time.LocalDateTime

@WebMvcTest(AdminUserController::class)
@AutoConfigureMockMvc(addFilters = false)
class AdminUserControllerTest {
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
    fun `PATCH admin_users_{id}_role - 회원 권한 변경`() {
        mockAuthenticatedUser(1L, "ROLE_ADMIN")
        every { userUseCase.updateUserRole(1L, 11L, UserAppRole.ADMIN) } returns sampleUser(11L, "ROLE_ADMIN")

        mvc.perform(
            patch("/api/v1/admin/users/11/role")
                .contentType(MediaType.APPLICATION_JSON)
                .content(mapper.writeValueAsString(UpdateUserRoleRequest(UserAppRole.ADMIN))),
        )
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.data.id").value(11))
            .andExpect(jsonPath("$.data.role").value("ROLE_ADMIN"))

        verify { userUseCase.updateUserRole(1L, 11L, UserAppRole.ADMIN) }
    }

    private fun sampleUser(userId: Long, role: String) =
        UserSummary(
            id = userId,
            userKey = 443731104L,
            nickname = "닉네임",
            emojiIconFilename = null,
            status = "ACTIVE",
            role = role,
            lastLoginAt = null,
            createdAt = LocalDateTime.now(),
        )

    private fun mockAuthenticatedUser(userId: Long, role: String) {
        val principal = SecurityPrincipal(userId = userId, role = role)
        val auth = UsernamePasswordAuthenticationToken(principal, null, listOf(SimpleGrantedAuthority(role)))
        SecurityContextHolder.getContext().authentication = auth
    }
}
