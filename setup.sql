-- Spentvise local database setup (MySQL 8+)
-- Jalankan: mysql -u root < setup.sql
CREATE DATABASE IF NOT EXISTS spendwise
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE spendwise;

CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  full_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS balances (
  user_id INT PRIMARY KEY,
  amount DECIMAL(15,2) NOT NULL DEFAULT 0,
  CONSTRAINT fk_balances_user FOREIGN KEY (user_id)
    REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- NOTE: nama tabel singular `income` (sesuai models/Income.js)
CREATE TABLE IF NOT EXISTS income (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  icon VARCHAR(50) NULL,
  source VARCHAR(255) NULL,
  amount DECIMAL(15,2) NOT NULL,
  date DATE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_income_user (user_id),
  CONSTRAINT fk_income_user FOREIGN KEY (user_id)
    REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- NOTE: nama tabel plural `expenses` (sesuai models/Expense.js)
CREATE TABLE IF NOT EXISTS expenses (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  icon VARCHAR(50) NULL,
  category VARCHAR(255) NULL,
  amount DECIMAL(15,2) NOT NULL,
  date DATE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_expenses_user (user_id),
  CONSTRAINT fk_expenses_user FOREIGN KEY (user_id)
    REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB;
