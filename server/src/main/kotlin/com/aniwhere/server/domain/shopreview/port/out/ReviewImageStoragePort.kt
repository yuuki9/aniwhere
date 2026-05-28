package com.aniwhere.server.domain.shopreview.port.out

import com.aniwhere.server.domain.shop.port.out.StoredShopImage

interface ReviewImageStoragePort {
    fun putObject(key: String, body: ByteArray, contentType: String)
    fun getObject(key: String): StoredShopImage
    fun deleteObject(key: String)
}
