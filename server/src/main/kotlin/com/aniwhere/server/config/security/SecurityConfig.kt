package com.aniwhere.server.config.security

import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.http.HttpMethod
import org.springframework.security.config.annotation.web.builders.HttpSecurity
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity
import org.springframework.security.config.http.SessionCreationPolicy
import org.springframework.security.web.SecurityFilterChain
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter

@Configuration
@EnableWebSecurity
class SecurityConfig(
    private val jwt: JwtTokenProvider,
) {
    @Bean
    fun filterChain(http: HttpSecurity): SecurityFilterChain =
        http
            .csrf { it.disable() }
            .sessionManagement { it.sessionCreationPolicy(SessionCreationPolicy.STATELESS) }
            .authorizeHttpRequests {
                it.requestMatchers("/api/v1/auth/**", "/swagger-ui.html", "/swagger-ui/**", "/v3/api-docs/**").permitAll()
                it.requestMatchers(HttpMethod.GET, "/api/v1/shops/**").permitAll()
                it.requestMatchers(HttpMethod.GET, "/api/v1/regions/**").permitAll()
                it.requestMatchers(HttpMethod.GET, "/api/v1/categories/**").permitAll()
                it.requestMatchers(HttpMethod.GET, "/api/v1/works/**").permitAll()
                it.requestMatchers(HttpMethod.GET, "/api/v1/shop-images/**").permitAll()
                it.requestMatchers(HttpMethod.GET, "/api/v1/posts/**").permitAll()
                it.requestMatchers(HttpMethod.POST, "/api/v1/shops/*/favorite").authenticated()
                it.requestMatchers(HttpMethod.DELETE, "/api/v1/shops/*/favorite").authenticated()
                it.requestMatchers(HttpMethod.POST, "/api/v1/shops/**").hasAuthority("ROLE_ADMIN")
                it.requestMatchers(HttpMethod.PUT, "/api/v1/shops/**").hasAuthority("ROLE_ADMIN")
                it.requestMatchers(HttpMethod.DELETE, "/api/v1/shops/**").hasAuthority("ROLE_ADMIN")
                it.anyRequest().authenticated()
            }
            .addFilterBefore(JwtAuthenticationFilter(jwt), UsernamePasswordAuthenticationFilter::class.java)
            .build()
}
