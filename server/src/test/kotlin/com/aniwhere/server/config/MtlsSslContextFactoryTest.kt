package com.aniwhere.server.config

import org.junit.jupiter.api.Test

class MtlsSslContextFactoryTest {
    @Test
    fun `파일이 없으면 실패`() {
        org.junit.jupiter.api.assertThrows<IllegalArgumentException> {
            MtlsSslContextFactory.fromPem("/missing/cert.crt", "/missing/key.key")
        }
    }
}
