-- ============================================================
-- MOBILITY CHEF - Complete MySQL 8.0 Database Schema
-- ============================================================

CREATE DATABASE IF NOT EXISTS mobility_chef
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE mobility_chef;

-- ============================================================
-- USERS TABLE (base for all roles)
-- ============================================================
CREATE TABLE users (
  id            BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  uuid          VARCHAR(36) NOT NULL UNIQUE DEFAULT (UUID()),
  role          ENUM('customer','chef','admin') NOT NULL DEFAULT 'customer',
  first_name    VARCHAR(100) NOT NULL,
  last_name     VARCHAR(100) NOT NULL,
  email         VARCHAR(255) NOT NULL UNIQUE,
  phone         VARCHAR(20),
  password_hash VARCHAR(255) NOT NULL,
  avatar_url    VARCHAR(512),
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  is_verified   BOOLEAN NOT NULL DEFAULT FALSE,
  email_verified_at DATETIME,
  phone_verified_at DATETIME,
  last_login_at DATETIME,
  preferred_language VARCHAR(10) DEFAULT 'en',
  oauth_provider VARCHAR(50),
  oauth_id       VARCHAR(255),
  created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at    DATETIME,
  INDEX idx_email (email),
  INDEX idx_role  (role),
  INDEX idx_uuid  (uuid)
) ENGINE=InnoDB;

-- ============================================================
-- CUSTOMER PROFILES
-- ============================================================
CREATE TABLE customer_profiles (
  id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id         BIGINT UNSIGNED NOT NULL UNIQUE,
  date_of_birth   DATE,
  dietary_prefs   JSON COMMENT 'array of preferences: vegan, halal, gluten-free...',
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

-- ============================================================
-- CUSTOMER ADDRESSES
-- ============================================================
CREATE TABLE addresses (
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

-- ============================================================
-- CHEF PROFILES
-- ============================================================
CREATE TABLE chef_profiles (
  id                   BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id              BIGINT UNSIGNED NOT NULL UNIQUE,
  bio                  TEXT,
  specialties          JSON COMMENT 'array of cuisine types',
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

-- ============================================================
-- CHEF PORTFOLIO
-- ============================================================
CREATE TABLE chef_portfolio (
  id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  chef_id     BIGINT UNSIGNED NOT NULL,
  image_url   VARCHAR(512) NOT NULL,
  caption     VARCHAR(255),
  sort_order  INT UNSIGNED DEFAULT 0,
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (chef_id) REFERENCES chef_profiles(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ============================================================
-- CHEF AVAILABILITY CALENDAR
-- ============================================================
CREATE TABLE chef_availability (
  id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  chef_id     BIGINT UNSIGNED NOT NULL,
  day_of_week TINYINT UNSIGNED COMMENT '0=Sunday 6=Saturday',
  date        DATE COMMENT 'specific date override',
  start_time  TIME NOT NULL,
  end_time    TIME NOT NULL,
  is_blocked  BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (chef_id) REFERENCES chef_profiles(id) ON DELETE CASCADE,
  INDEX idx_chef_date (chef_id, date),
  INDEX idx_chef_dow  (chef_id, day_of_week)
) ENGINE=InnoDB;

-- ============================================================
-- CUISINE CATEGORIES
-- ============================================================
CREATE TABLE cuisine_categories (
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

-- ============================================================
-- MENU ITEMS
-- ============================================================
CREATE TABLE menu_items (
  id               BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  category_id      BIGINT UNSIGNED NOT NULL,
  name             VARCHAR(200) NOT NULL,
  slug             VARCHAR(200) NOT NULL UNIQUE,
  description      TEXT,
  image_url        VARCHAR(512),
  base_price       DECIMAL(10,2) NOT NULL,
  prep_time_mins   INT UNSIGNED DEFAULT 30,
  serves           INT UNSIGNED DEFAULT 2,
  dietary_tags     JSON COMMENT 'vegan,halal,gluten-free,keto,...',
  ingredients      JSON,
  calories         INT UNSIGNED,
  is_active        BOOLEAN NOT NULL DEFAULT TRUE,
  is_featured      BOOLEAN NOT NULL DEFAULT FALSE,
  ai_tags          JSON COMMENT 'AI-generated recommendation tags',
  created_at       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES cuisine_categories(id),
  INDEX idx_category (category_id),
  FULLTEXT INDEX ft_menu (name, description)
) ENGINE=InnoDB;

-- ============================================================
-- CHEF MENUS (chefs list which items they can prepare)
-- ============================================================
CREATE TABLE chef_menu_items (
  id           BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  chef_id      BIGINT UNSIGNED NOT NULL,
  menu_item_id BIGINT UNSIGNED NOT NULL,
  custom_price DECIMAL(10,2) COMMENT 'override base price if set',
  is_available BOOLEAN NOT NULL DEFAULT TRUE,
  created_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_chef_menu (chef_id, menu_item_id),
  FOREIGN KEY (chef_id) REFERENCES chef_profiles(id) ON DELETE CASCADE,
  FOREIGN KEY (menu_item_id) REFERENCES menu_items(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ============================================================
-- BOOKINGS
-- ============================================================
CREATE TABLE bookings (
  id                   BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  uuid                 VARCHAR(36) NOT NULL UNIQUE DEFAULT (UUID()),
  customer_id          BIGINT UNSIGNED NOT NULL,
  chef_id              BIGINT UNSIGNED NOT NULL,
  address_id           BIGINT UNSIGNED NOT NULL,
  booking_date         DATE NOT NULL,
  start_time           TIME NOT NULL,
  end_time             TIME,
  status               ENUM('pending','confirmed','chef_en_route','in_progress','completed','cancelled','disputed') NOT NULL DEFAULT 'pending',
  booking_type         ENUM('standard','emergency','event') NOT NULL DEFAULT 'standard',
  guests_count         INT UNSIGNED DEFAULT 2,
  special_instructions TEXT,
  -- cost breakdown
  food_cost            DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  chef_fee             DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  transport_fee        DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  equipment_fee        DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  extra_service_fee    DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  platform_commission  DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  tax                  DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  total_amount         DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  currency             VARCHAR(3) NOT NULL DEFAULT 'KES',
  -- tracking
  chef_accepted_at     DATETIME,
  chef_departed_at     DATETIME,
  chef_arrived_at      DATETIME,
  service_started_at   DATETIME,
  service_completed_at DATETIME,
  customer_confirmed_at DATETIME,
  cancelled_at         DATETIME,
  cancelled_by         BIGINT UNSIGNED,
  cancellation_reason  TEXT,
  -- loyalty
  loyalty_points_earned INT UNSIGNED DEFAULT 0,
  loyalty_points_used   INT UNSIGNED DEFAULT 0,
  created_at           DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at           DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_id) REFERENCES users(id),
  FOREIGN KEY (chef_id) REFERENCES chef_profiles(id),
  FOREIGN KEY (address_id) REFERENCES addresses(id),
  INDEX idx_customer (customer_id),
  INDEX idx_chef     (chef_id),
  INDEX idx_status   (status),
  INDEX idx_date     (booking_date)
) ENGINE=InnoDB;

-- ============================================================
-- BOOKING ITEMS (selected menu items per booking)
-- ============================================================
CREATE TABLE booking_items (
  id           BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  booking_id   BIGINT UNSIGNED NOT NULL,
  menu_item_id BIGINT UNSIGNED NOT NULL,
  quantity     INT UNSIGNED NOT NULL DEFAULT 1,
  unit_price   DECIMAL(10,2) NOT NULL,
  subtotal     DECIMAL(10,2) NOT NULL,
  created_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
  FOREIGN KEY (menu_item_id) REFERENCES menu_items(id)
) ENGINE=InnoDB;

-- ============================================================
-- PAYMENTS
-- ============================================================
CREATE TABLE payments (
  id                   BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  uuid                 VARCHAR(36) NOT NULL UNIQUE DEFAULT (UUID()),
  booking_id           BIGINT UNSIGNED NOT NULL,
  user_id              BIGINT UNSIGNED NOT NULL,
  amount               DECIMAL(10,2) NOT NULL,
  currency             VARCHAR(3) NOT NULL DEFAULT 'KES',
  payment_method       ENUM('mpesa','stripe','paypal','visa','mastercard') NOT NULL,
  payment_status       ENUM('pending','processing','completed','failed','refunded','partially_refunded') NOT NULL DEFAULT 'pending',
  -- gateway references
  gateway_reference    VARCHAR(255),
  gateway_response     JSON,
  mpesa_receipt        VARCHAR(100),
  stripe_payment_id    VARCHAR(255),
  paypal_order_id      VARCHAR(255),
  -- refund
  refund_amount        DECIMAL(10,2),
  refunded_at          DATETIME,
  refund_reason        TEXT,
  -- metadata
  paid_at              DATETIME,
  created_at           DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at           DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (booking_id) REFERENCES bookings(id),
  FOREIGN KEY (user_id) REFERENCES users(id),
  INDEX idx_booking  (booking_id),
  INDEX idx_status   (payment_status)
) ENGINE=InnoDB;

-- ============================================================
-- PLATFORM COMMISSION SETTINGS
-- ============================================================
CREATE TABLE commission_settings (
  id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name            VARCHAR(100) NOT NULL,
  commission_rate DECIMAL(5,2) NOT NULL COMMENT 'percentage',
  tax_rate        DECIMAL(5,2) NOT NULL DEFAULT 16.00,
  effective_from  DATETIME NOT NULL,
  effective_to    DATETIME,
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  created_by      BIGINT UNSIGNED,
  created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id)
) ENGINE=InnoDB;

-- ============================================================
-- CHEF EARNINGS
-- ============================================================
CREATE TABLE chef_earnings (
  id            BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  chef_id       BIGINT UNSIGNED NOT NULL,
  booking_id    BIGINT UNSIGNED NOT NULL,
  gross_amount  DECIMAL(10,2) NOT NULL,
  commission    DECIMAL(10,2) NOT NULL,
  net_amount    DECIMAL(10,2) NOT NULL,
  status        ENUM('pending','paid','withheld') NOT NULL DEFAULT 'pending',
  paid_at       DATETIME,
  created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (chef_id) REFERENCES chef_profiles(id),
  FOREIGN KEY (booking_id) REFERENCES bookings(id),
  INDEX idx_chef   (chef_id),
  INDEX idx_status (status)
) ENGINE=InnoDB;

-- ============================================================
-- REVIEWS AND RATINGS
-- ============================================================
CREATE TABLE reviews (
  id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  booking_id  BIGINT UNSIGNED NOT NULL UNIQUE,
  customer_id BIGINT UNSIGNED NOT NULL,
  chef_id     BIGINT UNSIGNED NOT NULL,
  rating      TINYINT UNSIGNED NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment     TEXT,
  food_rating      TINYINT UNSIGNED CHECK (food_rating BETWEEN 1 AND 5),
  service_rating   TINYINT UNSIGNED CHECK (service_rating BETWEEN 1 AND 5),
  punctuality_rating TINYINT UNSIGNED CHECK (punctuality_rating BETWEEN 1 AND 5),
  chef_reply  TEXT,
  chef_replied_at DATETIME,
  is_visible  BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (booking_id) REFERENCES bookings(id),
  FOREIGN KEY (customer_id) REFERENCES users(id),
  FOREIGN KEY (chef_id) REFERENCES chef_profiles(id),
  INDEX idx_chef (chef_id)
) ENGINE=InnoDB;

-- ============================================================
-- MESSAGES (in-app messaging)
-- ============================================================
CREATE TABLE conversations (
  id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  booking_id  BIGINT UNSIGNED,
  user1_id    BIGINT UNSIGNED NOT NULL,
  user2_id    BIGINT UNSIGNED NOT NULL,
  last_message_at DATETIME,
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_conv (booking_id),
  FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE SET NULL,
  FOREIGN KEY (user1_id) REFERENCES users(id),
  FOREIGN KEY (user2_id) REFERENCES users(id)
) ENGINE=InnoDB;

CREATE TABLE messages (
  id               BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  conversation_id  BIGINT UNSIGNED NOT NULL,
  sender_id        BIGINT UNSIGNED NOT NULL,
  message_type     ENUM('text','image','location') NOT NULL DEFAULT 'text',
  content          TEXT NOT NULL,
  is_read          BOOLEAN NOT NULL DEFAULT FALSE,
  read_at          DATETIME,
  created_at       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
  FOREIGN KEY (sender_id) REFERENCES users(id),
  INDEX idx_conv   (conversation_id),
  INDEX idx_unread (conversation_id, is_read)
) ENGINE=InnoDB;

-- ============================================================
-- NOTIFICATIONS
-- ============================================================
CREATE TABLE notifications (
  id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id     BIGINT UNSIGNED NOT NULL,
  type        VARCHAR(50) NOT NULL,
  title       VARCHAR(255) NOT NULL,
  body        TEXT NOT NULL,
  data        JSON,
  is_read     BOOLEAN NOT NULL DEFAULT FALSE,
  read_at     DATETIME,
  channel     SET('push','sms','email','in_app') NOT NULL DEFAULT 'in_app',
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_unread (user_id, is_read)
) ENGINE=InnoDB;

-- ============================================================
-- FAVORITE CHEFS
-- ============================================================
CREATE TABLE favorite_chefs (
  id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  customer_id BIGINT UNSIGNED NOT NULL,
  chef_id     BIGINT UNSIGNED NOT NULL,
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_fav (customer_id, chef_id),
  FOREIGN KEY (customer_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (chef_id) REFERENCES chef_profiles(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ============================================================
-- LOYALTY TRANSACTIONS
-- ============================================================
CREATE TABLE loyalty_transactions (
  id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id     BIGINT UNSIGNED NOT NULL,
  booking_id  BIGINT UNSIGNED,
  type        ENUM('earn','redeem','expire','bonus','referral') NOT NULL,
  points      INT NOT NULL COMMENT 'positive=earn, negative=redeem',
  balance     INT UNSIGNED NOT NULL,
  description VARCHAR(255),
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ============================================================
-- REFERRALS
-- ============================================================
CREATE TABLE referrals (
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

-- ============================================================
-- DISPUTES
-- ============================================================
CREATE TABLE disputes (
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

-- ============================================================
-- GPS TRACKING LOGS
-- ============================================================
CREATE TABLE gps_tracking (
  id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  booking_id  BIGINT UNSIGNED NOT NULL,
  chef_id     BIGINT UNSIGNED NOT NULL,
  latitude    DECIMAL(10,8) NOT NULL,
  longitude   DECIMAL(11,8) NOT NULL,
  accuracy    FLOAT,
  speed       FLOAT COMMENT 'm/s',
  heading     FLOAT,
  recorded_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_booking (booking_id),
  INDEX idx_time    (recorded_at),
  FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
  FOREIGN KEY (chef_id) REFERENCES chef_profiles(id)
) ENGINE=InnoDB;

-- ============================================================
-- SUBSCRIPTION PLANS
-- ============================================================
CREATE TABLE subscription_plans (
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

-- ============================================================
-- AUDIT LOG
-- ============================================================
CREATE TABLE audit_logs (
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

-- ============================================================
-- PASSWORD RESET TOKENS
-- ============================================================
CREATE TABLE password_resets (
  id         BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id    BIGINT UNSIGNED NOT NULL,
  token      VARCHAR(255) NOT NULL,
  expires_at DATETIME NOT NULL,
  used_at    DATETIME,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_token (token)
) ENGINE=InnoDB;

-- ============================================================
-- REFRESH TOKENS
-- ============================================================
CREATE TABLE refresh_tokens (
  id         BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id    BIGINT UNSIGNED NOT NULL,
  token      VARCHAR(512) NOT NULL,
  device_info VARCHAR(255),
  ip_address VARCHAR(45),
  expires_at DATETIME NOT NULL,
  revoked_at DATETIME,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_token (token(191))
) ENGINE=InnoDB;
