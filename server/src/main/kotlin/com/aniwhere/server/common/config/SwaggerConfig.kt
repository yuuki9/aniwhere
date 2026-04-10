package com.aniwhere.server.common.config

import io.swagger.v3.oas.models.OpenAPI
import io.swagger.v3.oas.models.info.Info
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration

@Configuration
class SwaggerConfig {
    @Bean
    fun openAPI(): OpenAPI = OpenAPI().info(
        Info().title("Aniwhere API").version("v1").description("피규어샵 정보 & 커뮤니티 API")
    )
}
