package com.aniwhere.server

import org.springframework.boot.autoconfigure.SpringBootApplication
import org.springframework.boot.context.properties.ConfigurationPropertiesScan
import org.springframework.boot.runApplication

@SpringBootApplication
@ConfigurationPropertiesScan
class AniwhereServerApplication

fun main(args: Array<String>) {
    runApplication<AniwhereServerApplication>(*args)
}
