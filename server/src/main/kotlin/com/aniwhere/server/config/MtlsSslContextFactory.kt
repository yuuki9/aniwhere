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
import javax.net.ssl.KeyManagerFactory
import javax.net.ssl.SSLContext

object MtlsSslContextFactory {
    fun fromPem(certPath: String, keyPath: String): SSLContext {
        val certFile = Path.of(certPath)
        val keyFile = Path.of(keyPath)
        require(Files.isRegularFile(certFile)) {
            "mTLS 인증서 파일을 찾을 수 없습니다: $certPath"
        }
        require(Files.isRegularFile(keyFile)) {
            "mTLS 개인키 파일을 찾을 수 없습니다: $keyPath"
        }

        val cert = loadCertificate(certFile)
        val key = loadPrivateKey(keyFile)

        val keyStore = KeyStore.getInstance(KeyStore.getDefaultType())
        keyStore.load(null, null)
        keyStore.setCertificateEntry("client-cert", cert)
        keyStore.setKeyEntry("client-key", key, CharArray(0), arrayOf(cert))

        val keyManagerFactory = KeyManagerFactory.getInstance(KeyManagerFactory.getDefaultAlgorithm())
        keyManagerFactory.init(keyStore, CharArray(0))

        return SSLContext.getInstance("TLS").apply {
            init(keyManagerFactory.keyManagers, null, null)
        }
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
