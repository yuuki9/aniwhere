package com.aniwhere.server.common.config

import io.swagger.v3.oas.models.OpenAPI
import io.swagger.v3.oas.models.info.Info
import io.swagger.v3.oas.models.servers.Server
import org.springframework.beans.factory.annotation.Value
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration

@Configuration
class SwaggerConfig(
    @Value("\${app.api-public-url:}") private val apiPublicUrl: String,
) {
    @Bean
    fun openAPI(): OpenAPI {
        val info = Info()
            .title("Aniwhere API")
            .version("v1")
            .description("Figure shops & community API")
        val api = OpenAPI().info(info)
        val base = apiPublicUrl.trim().trimEnd('/')
        if (base.isNotEmpty()) {
            api.servers = listOf(Server().url(base).description("production"))
        }
        return api
    }
}
