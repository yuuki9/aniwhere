package com.aniwhere.server.config.security

import com.aniwhere.server.common.logging.LogMasking
import jakarta.servlet.FilterChain
import jakarta.servlet.http.HttpServletRequest
import jakarta.servlet.http.HttpServletResponse
import org.slf4j.LoggerFactory
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken
import org.springframework.security.core.authority.SimpleGrantedAuthority
import org.springframework.security.core.context.SecurityContextHolder
import org.springframework.web.filter.OncePerRequestFilter

class JwtAuthenticationFilter(
    private val jwt: JwtTokenProvider,
) : OncePerRequestFilter() {
    private val log = LoggerFactory.getLogger(javaClass)

    override fun doFilterInternal(request: HttpServletRequest, response: HttpServletResponse, chain: FilterChain) {
        val auth = request.getHeader("Authorization")
        if (auth != null && auth.startsWith("Bearer ")) {
            val token = auth.removePrefix("Bearer ").trim()
            runCatching {
                val userId = jwt.parseUserId(token)
                val role = jwt.parseRole(token)
                val principal = SecurityPrincipal(userId, role)
                val authorities = listOf(SimpleGrantedAuthority(role))
                val authentication = UsernamePasswordAuthenticationToken(principal, null, authorities)
                SecurityContextHolder.getContext().authentication = authentication
            }.onFailure { error ->
                if (request.requestURI.endsWith("/users/me")) {
                    log.warn(
                        "JWT authentication failed path={} token={} errorType={} message={}",
                        request.requestURI,
                        LogMasking.maskSecret(token),
                        error.javaClass.simpleName,
                        error.message,
                    )
                }
            }
        }
        chain.doFilter(request, response)
    }
}
