CREATE TABLE popularity_events (
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
    created_at TIMESTAMP NOT NULL
);

CREATE INDEX idx_popularity_events_occurred_at ON popularity_events (occurred_at);
CREATE INDEX idx_popularity_events_user_type_created ON popularity_events (user_id, event_type, created_at);
CREATE INDEX idx_popularity_events_shop_occurred ON popularity_events (shop_id, occurred_at);
CREATE INDEX idx_popularity_events_work_occurred ON popularity_events (work_id, occurred_at);
CREATE INDEX idx_popularity_events_keyword_occurred ON popularity_events (keyword_normalized, occurred_at);
