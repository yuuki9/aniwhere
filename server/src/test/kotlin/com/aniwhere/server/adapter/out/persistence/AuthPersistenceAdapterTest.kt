package com.aniwhere.server.adapter.out.persistence

import com.aniwhere.server.adapter.out.persistence.repository.AdminRepository
import com.aniwhere.server.adapter.out.persistence.repository.RefreshTokenRepository
import com.aniwhere.server.adapter.out.persistence.repository.TossUnlinkEventRepository
import com.aniwhere.server.adapter.out.persistence.repository.UserRepository
import io.mockk.every
import io.mockk.mockk
import io.mockk.verify
import org.junit.jupiter.api.Assertions.assertNull
import org.junit.jupiter.api.Test

class AuthPersistenceAdapterTest {
    private val userRepo = mockk<UserRepository>()
    private val adminRepo = mockk<AdminRepository>()
    private val refreshRepo = mockk<RefreshTokenRepository>()
    private val unlinkRepo = mockk<TossUnlinkEventRepository>()
    private val adapter = AuthPersistenceAdapter(userRepo, adminRepo, refreshRepo, unlinkRepo)

    @Test
    fun `userKey로 사용자 조회`() {
        every { userRepo.findByUserKey(443731104L) } returns null
        assertNull(adapter.findUserByUserKey(443731104L))
        verify(exactly = 1) { userRepo.findByUserKey(443731104L) }
    }
}
