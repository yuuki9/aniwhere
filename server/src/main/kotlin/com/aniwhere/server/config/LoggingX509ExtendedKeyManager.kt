package com.aniwhere.server.config

import java.net.Socket
import java.security.Principal
import javax.net.ssl.SSLEngine
import javax.net.ssl.X509ExtendedKeyManager

internal class LoggingX509ExtendedKeyManager(
    private val delegate: X509ExtendedKeyManager,
) : X509ExtendedKeyManager() {
    override fun chooseClientAlias(
        keyType: Array<out String>?,
        issuers: Array<out Principal>?,
        socket: Socket?,
    ): String? = recordSelection(delegate.chooseClientAlias(keyType, issuers, socket))

    override fun chooseEngineClientAlias(
        keyType: Array<out String>?,
        issuers: Array<out Principal>?,
        engine: SSLEngine?,
    ): String? = recordSelection(delegate.chooseEngineClientAlias(keyType, issuers, engine))

    override fun getClientAliases(
        keyType: String?,
        issuers: Array<out Principal>?,
    ): Array<String>? = delegate.getClientAliases(keyType, issuers)

    override fun getServerAliases(
        keyType: String?,
        issuers: Array<out Principal>?,
    ): Array<String>? = delegate.getServerAliases(keyType, issuers)

    override fun chooseServerAlias(
        keyType: String?,
        issuers: Array<out Principal>?,
        socket: Socket?,
    ): String? = delegate.chooseServerAlias(keyType, issuers, socket)

    override fun chooseEngineServerAlias(
        keyType: String?,
        issuers: Array<out Principal>?,
        engine: SSLEngine?,
    ): String? = delegate.chooseEngineServerAlias(keyType, issuers, engine)

    override fun getCertificateChain(alias: String?): Array<java.security.cert.X509Certificate>? =
        delegate.getCertificateChain(alias)

    override fun getPrivateKey(alias: String?): java.security.PrivateKey? = delegate.getPrivateKey(alias)

    private fun recordSelection(alias: String?): String? {
        if (alias.isNullOrBlank()) {
            return alias
        }

        val chain = delegate.getCertificateChain(alias)
        val subject = chain?.firstOrNull()?.subjectX500Principal?.name ?: "(unknown-subject)"
        MtlsRequestContext.recordClientCertSelection(alias = alias, subject = subject)
        return alias
    }
}
