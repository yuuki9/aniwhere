-- Canonical DDL: aniwhere-sql-ddl/analytics/01_popularity_events.sql
-- Existing DB migration: aniwhere-sql-ddl/migration/2026-06-03_popularity_events.sql
CREATE TABLE IF NOT EXISTS popularity_events (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    event_type VARCHAR(64) NOT NULL,
    shop_id BIGINT NULL,
    work_id INT NULL,
    keyword VARCHAR(100) NULL,
    keyword_normalized VARCHAR(100) NULL,
    work_keyword VARCHAR(100) NULL,
    work_keyword_normalized VARCHAR(100) NULL,
    scope VARCHAR(16) NULL,
    source VARCHAR(16) NULL,
    occurred_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP NOT NULL,
    INDEX idx_popularity_events_occurred_at (occurred_at),
    INDEX idx_popularity_events_user_type_created (user_id, event_type, created_at),
    INDEX idx_popularity_events_shop_occurred (shop_id, occurred_at),
    INDEX idx_popularity_events_work_occurred (work_id, occurred_at),
    INDEX idx_popularity_events_keyword_occurred (keyword_normalized, occurred_at)
);
