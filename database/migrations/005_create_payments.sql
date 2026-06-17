-- Migration 005: Payments, commissions, and earnings
USE mobility_chef;

CREATE TABLE IF NOT EXISTS commission_settings (
  id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name            VARCHAR(100) NOT NULL,
  commission_rate DECIMAL(5,2) NOT NULL,
  tax_rate        DECIMAL(5,2) NOT NULL DEFAULT 16.00,
  effective_from  DATETIME NOT NULL,
  effective_to    DATETIME,
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  created_by      BIGINT UNSIGNED,
  created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS payments (
  id                   BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  uuid                 VARCHAR(36) NOT NULL UNIQUE DEFAULT (UUID()),
  booking_id           BIGINT UNSIGNED NOT NULL,
  user_id              BIGINT UNSIGNED NOT NULL,
  amount               DECIMAL(10,2) NOT NULL,
  currency             VARCHAR(3) NOT NULL DEFAULT 'KES',
  payment_method       ENUM('mpesa','stripe','paypal','visa','mastercard') NOT NULL,
  payment_status       ENUM('pending','processing','completed','failed','refunded','partially_refunded') NOT NULL DEFAULT 'pending',
  gateway_reference    VARCHAR(255),
  gateway_response     JSON,
  mpesa_receipt        VARCHAR(100),
  stripe_payment_id    VARCHAR(255),
  paypal_order_id      VARCHAR(255),
  refund_amount        DECIMAL(10,2),
  refunded_at          DATETIME,
  refund_reason        TEXT,
  paid_at              DATETIME,
  created_at           DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at           DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (booking_id) REFERENCES bookings(id),
  FOREIGN KEY (user_id) REFERENCES users(id),
  INDEX idx_booking  (booking_id),
  INDEX idx_status   (payment_status)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS chef_earnings (
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
