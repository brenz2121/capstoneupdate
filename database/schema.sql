CREATE DATABASE IF NOT EXISTS vr_toilet_training
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE vr_toilet_training;

-- Minimal local schema required by the existing authentication routes.
CREATE TABLE IF NOT EXISTS users (
  user_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  role_id TINYINT UNSIGNED NOT NULL DEFAULT 2,
  full_name VARCHAR(120) NOT NULL,
  email VARCHAR(254) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS children (
  child_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  parent_id BIGINT UNSIGNED NOT NULL,
  full_name VARCHAR(120) NOT NULL,
  CONSTRAINT fk_children_parent FOREIGN KEY (parent_id) REFERENCES users(user_id)
);
