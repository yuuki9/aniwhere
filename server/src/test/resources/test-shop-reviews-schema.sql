-- Requires shops (test-shop-facets-schema.sql) and users (test-auth-schema.sql) loaded first.

CREATE TABLE shop_reviews (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    shop_id BIGINT NOT NULL,
    author_user_id BIGINT NOT NULL,
    rating TINYINT NOT NULL,
    content TEXT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'VISIBLE',
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    CONSTRAINT fk_shop_reviews_shop FOREIGN KEY (shop_id) REFERENCES shops (id) ON DELETE CASCADE,
    CONSTRAINT fk_shop_reviews_author_user FOREIGN KEY (author_user_id) REFERENCES users (id),
    CONSTRAINT chk_shop_reviews_rating CHECK (rating BETWEEN 1 AND 5),
    CONSTRAINT chk_shop_reviews_status CHECK (status IN ('VISIBLE', 'HIDDEN', 'DELETED'))
);

CREATE INDEX idx_shop_reviews_shop_status_created ON shop_reviews (shop_id, status, created_at DESC);
CREATE INDEX idx_shop_reviews_author_user ON shop_reviews (author_user_id);

CREATE TABLE shop_review_images (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    review_id BIGINT NOT NULL,
    s3_key VARCHAR(500) NOT NULL,
    sort_order INT NOT NULL,
    CONSTRAINT fk_shop_review_images_review FOREIGN KEY (review_id) REFERENCES shop_reviews (id) ON DELETE CASCADE
);

CREATE INDEX idx_shop_review_images_review ON shop_review_images (review_id);
