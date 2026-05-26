package com.aniwhere.server.config

import java.io.ByteArrayInputStream
import java.nio.file.Files
import java.nio.file.Path
import java.security.KeyFactory
import java.security.KeyStore
import java.security.cert.CertificateFactory
import java.security.cert.X509Certificate
import java.security.spec.PKCS8EncodedKeySpec
import java.util.Base64
import javax.net.ssl.KeyManager
import javax.net.ssl.KeyManagerFactory
import javax.net.ssl.SSLContext
import javax.net.ssl.X509ExtendedKeyManager
import org.slf4j.LoggerFactory

object MtlsSslContextFactory {
    private val log = LoggerFactory.getLogger(MtlsSslContextFactory::class.java)

    fun readConfiguredCertSubject(certPath: String): String {
        val cert = loadCertificate(Path.of(certPath))
        return cert.subjectX500Principal.name
    }

    fun fromPem(certPath: String, keyPath: String): SSLContext {
        val certFile = Path.of(certPath)
        val keyFile = Path.of(keyPath)
        require(Files.isRegularFile(certFile)) {
            "mTLS 인증서 파일을 찾을 수 없습니다: $certPath"
        }
        require(Files.isRegularFile(keyFile)) {
            "mTLS 개인키 파일을 찾을 수 없습니다: $keyPath"
        }

        logPemFile("mTLS cert file", certFile)
        logPemFile("mTLS key file", keyFile)

        val cert = loadCertificate(certFile)
        val key = loadPrivateKey(keyFile)

        log.info(
            "mTLS certificate loaded subject={} issuer={} serialNumber={} notBefore={} notAfter={}",
            cert.subjectX500Principal.name,
            cert.issuerX500Principal.name,
            cert.serialNumber,
            cert.notBefore,
            cert.notAfter,
        )
        log.info(
            "mTLS private key loaded algorithm={} format={}",
            key.algorithm,
            key.format,
        )

        val keyStore = KeyStore.getInstance(KeyStore.getDefaultType())
        keyStore.load(null, null)
        keyStore.setCertificateEntry("client-cert", cert)
        keyStore.setKeyEntry("client-key", key, CharArray(0), arrayOf(cert))

        val keyManagerFactory = KeyManagerFactory.getInstance(KeyManagerFactory.getDefaultAlgorithm())
        keyManagerFactory.init(keyStore, CharArray(0))
        val loggingKeyManagers = wrapWithClientCertLogging(keyManagerFactory.keyManagers)

        val sslContext =
            SSLContext.getInstance("TLS").apply {
                init(loggingKeyManagers, null, null)
            }
        log.info(
            "mTLS SSLContext ready protocol={} keyManagerCount={} clientCertLoggingEnabled=true",
            sslContext.protocol,
            loggingKeyManagers.size,
        )
        return sslContext
    }

    private fun wrapWithClientCertLogging(keyManagers: Array<KeyManager>): Array<KeyManager> =
        keyManagers.map { keyManager ->
            when (keyManager) {
                is X509ExtendedKeyManager -> LoggingX509ExtendedKeyManager(keyManager)
                else -> {
                    log.warn(
                        "mTLS KeyManager type={} is not X509ExtendedKeyManager; client-cert handshake logging skipped",
                        keyManager.javaClass.name,
                    )
                    keyManager
                }
            }
        }.toTypedArray()

    private fun logPemFile(label: String, path: Path) {
        val content = Files.readString(path)
        log.info(
            "{} path={} absolutePath={} sizeBytes={} pemHeader={}",
            label,
            path,
            path.toAbsolutePath(),
            Files.size(path),
            detectPemHeader(content),
        )
    }

    private fun detectPemHeader(content: String): String =
        when {
            content.contains("BEGIN CERTIFICATE") -> "CERTIFICATE"
            content.contains("BEGIN PRIVATE KEY") -> "PRIVATE KEY"
            content.contains("BEGIN RSA PRIVATE KEY") -> "RSA PRIVATE KEY (unsupported)"
            content.contains("BEGIN ENCRYPTED PRIVATE KEY") -> "ENCRYPTED PRIVATE KEY (unsupported)"
            else -> "UNKNOWN"
        }

    private fun loadCertificate(path: Path): X509Certificate {
        val content = Files.readString(path)
        val normalized =
            content
                .replace("-----BEGIN CERTIFICATE-----", "")
                .replace("-----END CERTIFICATE-----", "")
                .replace("\\s".toRegex(), "")
        val bytes = Base64.getDecoder().decode(normalized)
        return CertificateFactory.getInstance("X.509")
            .generateCertificate(ByteArrayInputStream(bytes)) as X509Certificate
    }

    private fun loadPrivateKey(path: Path): java.security.PrivateKey {
        val content = Files.readString(path)
        if (content.contains("BEGIN RSA PRIVATE KEY")) {
            throw IllegalArgumentException(
                "PKCS#1(RSA PRIVATE KEY) 형식은 지원하지 않습니다. " +
                    "openssl pkcs8 -topk8 -nocrypt -in ${path.fileName} -out ${path.fileName}.pkcs8 로 변환하세요.",
            )
        }

        val normalized =
            content
                .replace("-----BEGIN PRIVATE KEY-----", "")
                .replace("-----END PRIVATE KEY-----", "")
                .replace("\\s".toRegex(), "")
        val bytes = Base64.getDecoder().decode(normalized)
        val spec = PKCS8EncodedKeySpec(bytes)
        return KeyFactory.getInstance("RSA").generatePrivate(spec)
    }
}
