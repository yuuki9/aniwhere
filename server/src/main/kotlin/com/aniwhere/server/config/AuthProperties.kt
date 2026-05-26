package com.aniwhere.server.config

import org.springframework.boot.context.properties.ConfigurationProperties

@ConfigurationProperties(prefix = "app.auth")
data class AuthProperties(
    val jwt: Jwt = Jwt(),
    val toss: Toss = Toss(),
) {
    data class Jwt(
        val issuer: String = "aniwhere",
        val accessExpSeconds: Long = 900,
        val refreshExpSeconds: Long = 1209600,
        val secret: String = "",
    )

    data class Toss(
        val baseUrl: String = "https://apps-in-toss-api.toss.im",
        val clientId: String = "",
        val clientSecret: String = "",
        val unlinkBasicAuth: String = "",
        val mtls: Mtls = Mtls(),
    ) {
        data class Mtls(
            val enabled: Boolean = true,
            val certPath: String = "/home/ubuntu/mtls/aniwheretlv2_public.crt",
            val keyPath: String = "/home/ubuntu/mtls/aniwheretlv2_private.key",
            val skipStartupCheck: Boolean = false,
        )
    }
}
