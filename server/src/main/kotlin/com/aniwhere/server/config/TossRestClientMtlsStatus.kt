package com.aniwhere.server.config

data class TossRestClientMtlsStatus(
    val enabled: Boolean,
    val builderUsesMtlsHttpClient: Boolean,
    val configuredCertSubject: String?,
) {
    companion object {
        fun disabled(): TossRestClientMtlsStatus =
            TossRestClientMtlsStatus(
                enabled = false,
                builderUsesMtlsHttpClient = false,
                configuredCertSubject = null,
            )
    }
}
