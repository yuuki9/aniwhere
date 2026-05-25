package com.aniwhere.server.config

import java.nio.file.Files
import java.nio.file.Path
import org.springframework.boot.ApplicationArguments
import org.springframework.boot.ApplicationRunner
import org.springframework.core.Ordered
import org.springframework.core.annotation.Order
import org.springframework.stereotype.Component

/**
 * 배포 시 mTLS 파일 누락을 기동 단계에서 차단한다.
 * [AuthProperties.Toss.Mtls.skipStartupCheck] 는 파일 존재 검증만 건너뛰며 mTLS 적용 여부와는 무관하다.
 * mTLS를 끄려면 [AuthProperties.Toss.Mtls.enabled] 를 false 로 두거나
 * `APP_TOSS_MTLS_ENABLED=false` 를 설정한다.
 */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
class TossMtlsStartupValidator(
    private val props: AuthProperties,
) : ApplicationRunner {
    override fun run(args: ApplicationArguments) {
        val mtls = props.toss.mtls
        if (!mtls.enabled || mtls.skipStartupCheck) return

        val certPath = Path.of(mtls.certPath)
        val keyPath = Path.of(mtls.keyPath)
        if (!Files.isRegularFile(certPath) || !Files.isRegularFile(keyPath)) {
            throw IllegalStateException(
                "Toss mTLS 파일이 없어 기동을 중단했습니다. " +
                    "cert=${mtls.certPath}, key=${mtls.keyPath}. " +
                    "파일 존재 검증만 건너뛰려면 APP_TOSS_MTLS_SKIP_STARTUP_CHECK=true, " +
                    "mTLS 자체를 끄려면 APP_TOSS_MTLS_ENABLED=false 를 설정하세요.",
            )
        }
    }
}
