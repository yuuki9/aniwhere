package com.aniwhere.server.config

import org.junit.jupiter.api.Assertions.assertThrows
import org.junit.jupiter.api.Test
import org.springframework.boot.DefaultApplicationArguments

class TossMtlsStartupValidatorTest {
    private val noArgs = DefaultApplicationArguments()

    @Test
    fun `mTLS 파일이 없고 스킵이 아니면 기동 검증 실패`() {
        val validator =
            TossMtlsStartupValidator(
                AuthProperties(
                    toss =
                        AuthProperties.Toss(
                            mtls =
                                AuthProperties.Toss.Mtls(
                                    certPath = "/path/does/not/exist.crt",
                                    keyPath = "/path/does/not/exist.key",
                                ),
                        ),
                ),
            )
        assertThrows(IllegalStateException::class.java) {
            validator.run(noArgs)
        }
    }

    @Test
    fun `스킵이면 mTLS 파일 없어도 검증 통과`() {
        val validator =
            TossMtlsStartupValidator(
                AuthProperties(
                    toss =
                        AuthProperties.Toss(
                            mtls = AuthProperties.Toss.Mtls(skipStartupCheck = true),
                        ),
                ),
            )
        validator.run(noArgs)
    }

    @Test
    fun `mTLS 비활성화면 파일 없어도 검증 통과`() {
        val validator =
            TossMtlsStartupValidator(
                AuthProperties(
                    toss =
                        AuthProperties.Toss(
                            mtls =
                                AuthProperties.Toss.Mtls(
                                    enabled = false,
                                    certPath = "/path/does/not/exist.crt",
                                    keyPath = "/path/does/not/exist.key",
                                ),
                        ),
                ),
            )
        validator.run(noArgs)
    }
}
