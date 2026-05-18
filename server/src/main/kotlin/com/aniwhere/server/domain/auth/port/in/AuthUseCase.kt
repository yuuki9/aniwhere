package com.aniwhere.server.domain.auth.port.`in`

import com.aniwhere.server.domain.auth.model.LoginResult
import com.aniwhere.server.domain.auth.model.RefreshResult

interface AuthUseCase {
    fun login(authorizationCode: String, referrer: String): LoginResult
    fun refresh(refreshToken: String): RefreshResult
    fun logout(refreshToken: String)
    fun handleUnlink(userKey: Long, referrer: String, rawPayload: String?)
}
