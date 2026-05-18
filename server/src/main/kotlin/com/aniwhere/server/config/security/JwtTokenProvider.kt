package com.aniwhere.server.config.security

import com.aniwhere.server.config.AuthProperties
import io.jsonwebtoken.Jwts
import io.jsonwebtoken.security.Keys
import org.springframework.stereotype.Component
import java.nio.charset.StandardCharsets
import java.security.MessageDigest
import java.time.Instant
import java.util.Date
import javax.crypto.SecretKey

@Component
class JwtTokenProvider(private val props: AuthProperties) {
    private val key: SecretKey = Keys.hmacShaKeyFor(props.jwt.secret.toByteArray(StandardCharsets.UTF_8))

    fun createAccessToken(userId: Long, role: String): String =
        Jwts.builder()
            .subject(userId.toString())
            .claim("role", role)
            .issuer(props.jwt.issuer)
            .expiration(Date.from(Instant.now().plusSeconds(props.jwt.accessExpSeconds)))
            .signWith(key)
            .compact()

    fun createRefreshToken(userId: Long): String =
        Jwts.builder()
            .subject(userId.toString())
            .claim("type", "refresh")
            .issuer(props.jwt.issuer)
            .expiration(Date.from(Instant.now().plusSeconds(props.jwt.refreshExpSeconds)))
            .signWith(key)
            .compact()

    fun parseUserId(token: String): Long =
        Jwts.parser()
            .verifyWith(key)
            .build()
            .parseSignedClaims(token)
            .payload
            .subject
            .toLong()

    fun parseRole(token: String): String =
        Jwts.parser()
            .verifyWith(key)
            .build()
            .parseSignedClaims(token)
            .payload["role"]
            .toString()

    fun parseExpiryEpochSeconds(token: String): Long =
        Jwts.parser()
            .verifyWith(key)
            .build()
            .parseSignedClaims(token)
            .payload
            .expiration
            .toInstant()
            .epochSecond

    fun hashRefreshToken(token: String): String {
        val digest = MessageDigest.getInstance("SHA-256").digest(token.toByteArray(StandardCharsets.UTF_8))
        return digest.joinToString("") { "%02x".format(it) }
    }
}
