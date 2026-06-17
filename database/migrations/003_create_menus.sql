-- Migration 003: Cuisine categories and menu items
USE mobility_chef;

CREATE TABLE IF NOT EXISTS cuisine_categories (
  id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(100) NOT NULL UNIQUE,
  slug        VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  image_url   VARCHAR(512),
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order  INT UNSIGNED DEFAULT 0,
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS menu_items (
  id               BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  category_id      BIGINT UNSIGNED NOT NULL,
  name             VARCHAR(200) NOT NULL,
  slug             VARCHAR(200) NOT NULL UNIQUE,
  description      TEXT,
  image_url        VARCHAR(512),
  base_price       DECIMAL(10,2) NOT NULL,
  prep_time_mins   INT UNSIGNED DEFAULT 30,
  serves           INT UNSIGNED DEFAULT 2,
  dietary_tags     JSON,
  ingredients      JSON,
  calories         INT UNSIGNED,
  is_active        BOOLEAN NOT NULL DEFAULT TRUE,
  is_featured      BOOLEAN NOT NULL DEFAULT FALSE,
  ai_tags          JSON,
  created_at       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES cuisine_categories(id),
  INDEX idx_category (category_id),
  FULLTEXT INDEX ft_menu (name, description)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS chef_menu_items (
  id           BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  chef_id      BIGINT UNSIGNED NOT NULL,
  menu_item_id BIGINT UNSIGNED NOT NULL,
  custom_price DECIMAL(10,2),
  is_available BOOLEAN NOT NULL DEFAULT TRUE,
  created_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_chef_menu (chef_id, menu_item_id),
  FOREIGN KEY (chef_id) REFERENCES chef_profiles(id) ON DELETE CASCADE,
  FOREIGN KEY (menu_item_id) REFERENCES menu_items(id) ON DELETE CASCADE
) ENGINE=InnoDB;
