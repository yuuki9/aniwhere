package com.aniwhere.server.domain.auth.port.out

interface TossAuthPort {
    fun exchangeAndGetUserKey(authorizationCode: String, referrer: String): Long
}
