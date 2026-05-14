package com.aniwhere.server.config

import org.hibernate.Interceptor
import org.hibernate.type.Type
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Component
import org.springframework.transaction.support.TransactionSynchronization
import org.springframework.transaction.support.TransactionSynchronizationManager

private const val ENTITY_PACKAGE = "com.aniwhere.server.adapter.out.persistence.entity"

/**
 * 트랜잭션 커밋이 성공한 뒤에만 영속 변경을 로깅합니다(롤백 시 로그 없음).
 */
@Component
class PersistenceAuditInterceptor : Interceptor {

    private val log = LoggerFactory.getLogger("com.aniwhere.server.persistence.audit")

    private val pendingOps = ThreadLocal<MutableList<String>>()
    private val syncRegistered = ThreadLocal<Boolean?>()

    private fun entitySummary(entity: Any, id: Any?): String =
        "${entity.javaClass.simpleName}${if (id != null) " id=$id" else ""}"

    private fun isTrackedEntity(entity: Any?): Boolean =
        entity != null && entity.javaClass.name.startsWith(ENTITY_PACKAGE)

    private fun scheduleAfterCommit(line: String) {
        if (!TransactionSynchronizationManager.isSynchronizationActive()) {
            log.info("{} (no active transaction)", line)
            return
        }
        var list = pendingOps.get()
        if (list == null) {
            list = mutableListOf()
            pendingOps.set(list)
        }
        list.add(line)

        if (syncRegistered.get() == true) return
        syncRegistered.set(true)

        TransactionSynchronizationManager.registerSynchronization(
            object : TransactionSynchronization {
                override fun afterCommit() {
                    pendingOps.get()?.forEach { entry -> log.info(entry) }
                }

                override fun afterCompletion(status: Int) {
                    pendingOps.remove()
                    syncRegistered.remove()
                }
            },
        )
    }

    override fun onSave(
        entity: Any?,
        id: Any?,
        state: Array<Any?>?,
        propertyNames: Array<String?>?,
        types: Array<Type?>?,
    ): Boolean {
        if (isTrackedEntity(entity)) {
            scheduleAfterCommit("INSERT ${entitySummary(entity!!, id)}")
        }
        return false
    }

    override fun onFlushDirty(
        entity: Any?,
        id: Any?,
        currentState: Array<Any?>?,
        previousState: Array<Any?>?,
        propertyNames: Array<String?>?,
        types: Array<Type?>?,
    ): Boolean {
        if (isTrackedEntity(entity)) {
            scheduleAfterCommit("UPDATE ${entitySummary(entity!!, id)}")
        }
        return false
    }

    override fun onDelete(
        entity: Any?,
        id: Any?,
        state: Array<Any?>?,
        propertyNames: Array<String?>?,
        types: Array<Type?>?,
    ) {
        if (isTrackedEntity(entity)) {
            scheduleAfterCommit("DELETE ${entitySummary(entity!!, id)}")
        }
    }
}
