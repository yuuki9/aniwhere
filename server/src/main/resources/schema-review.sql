-- =============================================
-- Review Tables (후기·제보 스키마, REST 경로는 /api/v1/posts 유지)
-- =============================================

CREATE TABLE IF NOT EXISTS posts (
    id               BIGINT       NOT NULL AUTO_INCREMENT,
    title            VARCHAR(200) NOT NULL,
    content          TEXT         NOT NULL,
    author_user_id   BIGINT       NOT NULL,
    author_nickname  VARCHAR(50)  NOT NULL,
    view_count       BIGINT       NOT NULL DEFAULT 0,
    like_count       BIGINT       NOT NULL DEFAULT 0,
    created_at       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_posts_created (created_at DESC),
    KEY idx_posts_author_user (author_user_id),
    CONSTRAINT fk_posts_author_user FOREIGN KEY (author_user_id) REFERENCES users (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS post_likes (
    id               BIGINT       NOT NULL AUTO_INCREMENT,
    post_id          BIGINT       NOT NULL,
    user_id          BIGINT       NOT NULL,
    created_at       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uk_post_likes_post_id_user_id (post_id, user_id),
    KEY idx_post_likes_post_id (post_id),
    KEY idx_post_likes_user_id (user_id),
    CONSTRAINT fk_post_likes_post FOREIGN KEY (post_id) REFERENCES posts (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS comments (
    id               BIGINT       NOT NULL AUTO_INCREMENT,
    post_id          BIGINT       NOT NULL,
    author_user_id   BIGINT       NOT NULL,
    content          TEXT         NOT NULL,
    author_nickname  VARCHAR(50)  NOT NULL,
    created_at       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_comments_post (post_id),
    KEY idx_comments_author_user (author_user_id),
    CONSTRAINT fk_comments_post FOREIGN KEY (post_id) REFERENCES posts (id) ON DELETE CASCADE,
    CONSTRAINT fk_comments_author_user FOREIGN KEY (author_user_id) REFERENCES users (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
