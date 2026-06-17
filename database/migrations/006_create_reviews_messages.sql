-- Migration 006: Reviews, conversations, messages, notifications
USE mobility_chef;

CREATE TABLE IF NOT EXISTS reviews (
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

CREATE TABLE IF NOT EXISTS conversations (
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

CREATE TABLE IF NOT EXISTS messages (
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

CREATE TABLE IF NOT EXISTS notifications (
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
