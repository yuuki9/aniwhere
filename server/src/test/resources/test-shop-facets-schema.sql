CREATE TABLE regions (
    id SMALLINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    city VARCHAR(50) NOT NULL,
    created_at TIMESTAMP NOT NULL
);

CREATE TABLE categories (
    id SMALLINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE
);

CREATE TABLE works (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    cover_url VARCHAR(1024),
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    dtype VARCHAR(31) NOT NULL
);

CREATE TABLE works_game (
    work_id INT PRIMARY KEY,
    CONSTRAINT fk_works_game_work FOREIGN KEY (work_id) REFERENCES works(id)
);

CREATE TABLE shops (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    address VARCHAR(255) NOT NULL,
    px DECIMAL(10, 7) NOT NULL,
    py DECIMAL(10, 7) NOT NULL,
    floor VARCHAR(20),
    region_id SMALLINT,
    status VARCHAR(255) NOT NULL,
    visit_tip TEXT,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    average_rating DECIMAL(3, 2),
    review_count INT NOT NULL DEFAULT 0,
    CONSTRAINT fk_shops_region FOREIGN KEY (region_id) REFERENCES regions(id)
);

CREATE TABLE shop_categories (
    shop_id BIGINT NOT NULL,
    category_id SMALLINT NOT NULL,
    PRIMARY KEY (shop_id, category_id),
    CONSTRAINT fk_shop_categories_shop FOREIGN KEY (shop_id) REFERENCES shops(id),
    CONSTRAINT fk_shop_categories_category FOREIGN KEY (category_id) REFERENCES categories(id)
);

CREATE TABLE shop_works (
    shop_id BIGINT NOT NULL,
    work_id INT NOT NULL,
    PRIMARY KEY (shop_id, work_id),
    CONSTRAINT fk_shop_works_shop FOREIGN KEY (shop_id) REFERENCES shops(id),
    CONSTRAINT fk_shop_works_work FOREIGN KEY (work_id) REFERENCES works(id)
);
