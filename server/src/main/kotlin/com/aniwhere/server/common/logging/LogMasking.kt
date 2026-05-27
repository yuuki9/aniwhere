package com.aniwhere.server.common.logging

object LogMasking {
    fun maskSecret(value: String): String {
        val trimmed = value.trim()
        if (trimmed.length <= 8) return "***"
        return "${trimmed.take(4)}...${trimmed.takeLast(4)}(len=${trimmed.length})"
    }
}
