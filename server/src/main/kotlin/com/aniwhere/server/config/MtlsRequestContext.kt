package com.aniwhere.server.config

import org.slf4j.LoggerFactory

object MtlsRequestContext {
    private val log = LoggerFactory.getLogger(MtlsRequestContext::class.java)

    private val requestId = ThreadLocal<String?>()
    private val selectedClientCert = ThreadLocal<SelectedClientCert?>()

    data class SelectedClientCert(
        val alias: String,
        val subject: String,
    )

    fun bind(requestId: String) {
        this.requestId.set(requestId)
        selectedClientCert.remove()
    }

    fun clear() {
        requestId.remove()
        selectedClientCert.remove()
    }

    fun recordClientCertSelection(
        alias: String,
        subject: String,
    ) {
        selectedClientCert.set(SelectedClientCert(alias = alias, subject = subject))
        log.info(
            "mTLS client certificate selected during TLS handshake requestId={} alias={} subject={}",
            requestId.get() ?: "(no-request-id)",
            alias,
            subject,
        )
    }

    fun selectedClientCert(): SelectedClientCert? = selectedClientCert.get()
}
