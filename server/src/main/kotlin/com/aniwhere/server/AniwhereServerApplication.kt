package com.aniwhere.server

import org.springframework.boot.autoconfigure.SpringBootApplication
import org.springframework.boot.runApplication

@SpringBootApplication
class AniwhereServerApplication

fun main(args: Array<String>) {
    runApplication<AniwhereServerApplication>(*args)
}
