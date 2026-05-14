package com.aniwhere.server.adapter.out.persistence

import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertNotNull
import org.junit.jupiter.api.Test
import org.springframework.transaction.annotation.Transactional

class ShopPersistenceAdapterTransactionTest {

    @Test
    fun `ShopPersistenceAdapter maps lazy shop relations inside transaction boundary`() {
        val classTx = ShopPersistenceAdapter::class.java.getAnnotation(Transactional::class.java)
        val writeMethods = listOf("save", "saveShopImageRecords", "swapShopImageRecords", "update", "deleteById")

        assertNotNull(classTx)
        assertEquals(true, classTx.readOnly)

        writeMethods.forEach { methodName ->
            val method = ShopPersistenceAdapter::class.java.methods.firstOrNull { it.name == methodName }
            assertNotNull(method, "$methodName method should exist")
            val methodTx = method!!.getAnnotation(Transactional::class.java)

            assertNotNull(methodTx, "$methodName should declare a write transaction")
            assertEquals(false, methodTx.readOnly, "$methodName should not be read-only")
        }
    }
}
