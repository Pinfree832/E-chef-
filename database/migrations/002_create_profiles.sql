-- Migration 002: Customer profiles, addresses, chef profiles
USE mobility_chef;

CREATE TABLE IF NOT EXISTS customer_profiles (
  id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id         BIGINT UNSIGNED NOT NULL UNIQUE,
  date_of_birth   DATE,
  dietary_prefs   JSON,
  allergies       JSON,
  loyalty_points  INT UNSIGNED NOT NULL DEFAULT 0,
  referral_code   VARCHAR(20) UNIQUE,
  referred_by_id  BIGINT UNSIGNED,
  subscription_plan ENUM('free','basic','premium') DEFAULT 'free',
  subscription_expires_at DATETIME,
  created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (referred_by_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS addresses (
  id           BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id      BIGINT UNSIGNED NOT NULL,
  label        VARCHAR(50) NOT NULL DEFAULT 'Home',
  address_line1 VARCHAR(255) NOT NULL,
  address_line2 VARCHAR(255),
  city         VARCHAR(100) NOT NULL,
  state        VARCHAR(100),
  postal_code  VARCHAR(20),
  country      VARCHAR(100) NOT NULL DEFAULT 'Kenya',
  latitude     DECIMAL(10,8),
  longitude    DECIMAL(11,8),
  is_default   BOOLEAN NOT NULL DEFAULT FALSE,
  created_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS chef_profiles (
  id                   BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id              BIGINT UNSIGNED NOT NULL UNIQUE,
  bio                  TEXT,
  specialties          JSON,
  years_of_experience  INT UNSIGNED DEFAULT 0,
  certification_url    VARCHAR(512),
  id_document_url      VARCHAR(512),
  verification_status  ENUM('pending','approved','rejected','suspended') DEFAULT 'pending',
  verified_at          DATETIME,
  verified_by_id       BIGINT UNSIGNED,
  base_hourly_rate     DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  travel_rate_per_km   DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  equipment_fee        DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  avg_rating           DECIMAL(3,2) DEFAULT 0.00,
  total_bookings       INT UNSIGNED DEFAULT 0,
  total_earnings       DECIMAL(12,2) DEFAULT 0.00,
  current_latitude     DECIMAL(10,8),
  current_longitude    DECIMAL(11,8),
  is_available         BOOLEAN NOT NULL DEFAULT FALSE,
  service_radius_km    INT UNSIGNED DEFAULT 20,
  bank_account_name    VARCHAR(200),
  bank_account_number  VARCHAR(100),
  bank_name            VARCHAR(200),
  mpesa_number         VARCHAR(20),
  created_at           DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at           DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (verified_by_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS chef_portfolio (
  id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  chef_id     BIGINT UNSIGNED NOT NULL,
  image_url   VARCHAR(512) NOT NULL,
  caption     VARCHAR(255),
  sort_order  INT UNSIGNED DEFAULT 0,
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (chef_id) REFERENCES chef_profiles(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS chef_availability (
  id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  chef_id     BIGINT UNSIGNED NOT NULL,
  day_of_week TINYINT UNSIGNED,
  date        DATE,
  start_time  TIME NOT NULL,
  end_time    TIME NOT NULL,
  is_blocked  BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (chef_id) REFERENCES chef_profiles(id) ON DELETE CASCADE
) ENGINE=InnoDB;
