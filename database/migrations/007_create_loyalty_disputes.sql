-- Migration 007: Loyalty, referrals, disputes, GPS, audit
USE mobility_chef;

CREATE TABLE IF NOT EXISTS favorite_chefs (
  id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  customer_id BIGINT UNSIGNED NOT NULL,
  chef_id     BIGINT UNSIGNED NOT NULL,
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_fav (customer_id, chef_id),
  FOREIGN KEY (customer_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (chef_id) REFERENCES chef_profiles(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS loyalty_transactions (
  id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id     BIGINT UNSIGNED NOT NULL,
  booking_id  BIGINT UNSIGNED,
  type        ENUM('earn','redeem','expire','bonus','referral') NOT NULL,
  points      INT NOT NULL,
  balance     INT UNSIGNED NOT NULL,
  description VARCHAR(255),
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS referrals (
  id            BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  referrer_id   BIGINT UNSIGNED NOT NULL,
  referred_id   BIGINT UNSIGNED NOT NULL,
  status        ENUM('pending','rewarded') NOT NULL DEFAULT 'pending',
  reward_points INT UNSIGNED DEFAULT 0,
  rewarded_at   DATETIME,
  created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_ref (referrer_id, referred_id),
  FOREIGN KEY (referrer_id) REFERENCES users(id),
  FOREIGN KEY (referred_id) REFERENCES users(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS disputes (
  id           BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  booking_id   BIGINT UNSIGNED NOT NULL,
  raised_by    BIGINT UNSIGNED NOT NULL,
  against      BIGINT UNSIGNED NOT NULL,
  reason       VARCHAR(100) NOT NULL,
  description  TEXT NOT NULL,
  evidence_urls JSON,
  status       ENUM('open','investigating','resolved','closed') NOT NULL DEFAULT 'open',
  resolution   TEXT,
  resolved_by  BIGINT UNSIGNED,
  resolved_at  DATETIME,
  created_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (booking_id) REFERENCES bookings(id),
  FOREIGN KEY (raised_by) REFERENCES users(id),
  FOREIGN KEY (against) REFERENCES users(id),
  FOREIGN KEY (resolved_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS gps_tracking (
  id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  booking_id  BIGINT UNSIGNED NOT NULL,
  chef_id     BIGINT UNSIGNED NOT NULL,
  latitude    DECIMAL(10,8) NOT NULL,
  longitude   DECIMAL(11,8) NOT NULL,
  accuracy    FLOAT,
  speed       FLOAT,
  heading     FLOAT,
  recorded_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_booking (booking_id),
  INDEX idx_time    (recorded_at),
  FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
  FOREIGN KEY (chef_id) REFERENCES chef_profiles(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS subscription_plans (
  id                BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name              VARCHAR(50) NOT NULL,
  slug              VARCHAR(50) NOT NULL UNIQUE,
  price_monthly     DECIMAL(10,2) NOT NULL,
  price_yearly      DECIMAL(10,2),
  features          JSON,
  discount_percent  DECIMAL(5,2) DEFAULT 0.00,
  priority_booking  BOOLEAN DEFAULT FALSE,
  free_deliveries   INT UNSIGNED DEFAULT 0,
  loyalty_multiplier DECIMAL(3,1) DEFAULT 1.0,
  is_active         BOOLEAN DEFAULT TRUE,
  created_at        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS audit_logs (
  id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id     BIGINT UNSIGNED,
  action      VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50),
  entity_id   BIGINT UNSIGNED,
  old_values  JSON,
  new_values  JSON,
  ip_address  VARCHAR(45),
  user_agent  TEXT,
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_user   (user_id),
  INDEX idx_entity (entity_type, entity_id)
) ENGINE=InnoDB;
