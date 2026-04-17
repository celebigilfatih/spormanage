-- =====================================================
-- Merkezi Lisans Veritabanı Oluşturma
-- Bu script PostgreSQL sunucusunda çalıştırılmalıdır
-- =====================================================

-- 1. Veritabanını oluştur (psql ile bağlanıp çalıştırın)
-- CREATE DATABASE license_db;

-- 2. license_db'ye bağlandıktan sonra bu tabloyu oluşturun:
-- \c license_db

CREATE TABLE IF NOT EXISTS licenses (
  id SERIAL PRIMARY KEY,
  license_key VARCHAR(50) UNIQUE NOT NULL,
  customer_name VARCHAR(255) NOT NULL,
  database_name VARCHAR(100),
  domain VARCHAR(255),
  plan_type VARCHAR(20) DEFAULT 'MONTHLY' CHECK (plan_type IN ('MONTHLY', 'YEARLY')),
  monthly_fee DECIMAL(10,2) DEFAULT 3000.00,
  start_date DATE NOT NULL,
  expiry_date DATE NOT NULL,
  is_active BOOLEAN DEFAULT true,
  max_students INT DEFAULT 0,
  contact_name VARCHAR(255),
  contact_email VARCHAR(255),
  contact_phone VARCHAR(50),
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Örnek lisans kaydı (kendi instance'ınız için)
INSERT INTO licenses (license_key, customer_name, database_name, domain, plan_type, monthly_fee, start_date, expiry_date, is_active, contact_name, contact_email, contact_phone)
VALUES 
  ('ADMIN-MASTER-001', 'Ana Yönetim Paneli', 'aidat_takip', 'portal.spormanage.com.tr', 'YEARLY', 0, '2025-01-01', '2099-12-31', true, 'Admin', 'admin@spormanage.com.tr', '+90 000 000 0000')
ON CONFLICT (license_key) DO NOTHING;

-- updated_at otomatik güncelleme trigger'ı
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_licenses_updated_at ON licenses;
CREATE TRIGGER update_licenses_updated_at
  BEFORE UPDATE ON licenses
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
