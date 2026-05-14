package com.aniwhere.server.config

import org.springframework.boot.autoconfigure.orm.jpa.HibernatePropertiesCustomizer
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration

@Configuration
class PersistenceAuditConfig {

    @Bean
    fun persistenceAuditHibernateCustomizer(
        interceptor: PersistenceAuditInterceptor,
    ): HibernatePropertiesCustomizer =
        HibernatePropertiesCustomizer { props ->
            props["hibernate.session_factory.interceptor"] = interceptor
        }
}
