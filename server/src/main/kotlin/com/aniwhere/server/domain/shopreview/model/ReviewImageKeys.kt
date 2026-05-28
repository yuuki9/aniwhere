package com.aniwhere.server.domain.shopreview.model

import com.aniwhere.server.config.ReviewImagesS3Properties

object ReviewImageKeys {
    fun gallery(reviewId: Long, sortIndex: Int, extension: String): String =
        "${ReviewImagesS3Properties.KEY_PREFIX}/$reviewId/gallery-${sortIndex + 1}.$extension"
}
