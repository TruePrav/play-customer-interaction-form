-- Migration: Add form options tables
-- Run this in Supabase SQL Editor to create tables for managing form options

-- Create staff_members table
CREATE TABLE IF NOT EXISTS staff_members (
  id BIGSERIAL PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create channels table
CREATE TABLE IF NOT EXISTS channels (
  id BIGSERIAL PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create categories table
CREATE TABLE IF NOT EXISTS categories (
  id BIGSERIAL PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create branches table
CREATE TABLE IF NOT EXISTS branches (
  id BIGSERIAL PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Insert default staff members
INSERT INTO staff_members (name, display_order) VALUES
  ('Mohammed', 1),
  ('Shelly', 2),
  ('Kemar', 3),
  ('Dameon', 4),
  ('Carson', 5),
  ('Mahesh', 6),
  ('Sunil', 7),
  ('Praveen', 8)
ON CONFLICT (name) DO NOTHING;

-- Insert default channels
INSERT INTO channels (name, display_order) VALUES
  ('In-store', 1),
  ('Phone', 2),
  ('WhatsApp', 3),
  ('Instagram', 4),
  ('Facebook', 5),
  ('Email', 6),
  ('Other', 7)
ON CONFLICT (name) DO NOTHING;

-- Insert default categories
INSERT INTO categories (name, display_order) VALUES
  ('Digital Cards', 1),
  ('Consoles', 2),
  ('Games', 3),
  ('Accessories', 4),
  ('Repair/Service', 5),
  ('Pokemon Cards', 6),
  ('Electronics', 7),
  ('Other', 8)
ON CONFLICT (name) DO NOTHING;

-- Insert default branches
INSERT INTO branches (name, display_order) VALUES
  ('Bridgetown', 1),
  ('Sheraton', 2)
ON CONFLICT (name) DO NOTHING;

-- Enable RLS
ALTER TABLE staff_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE branches ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Allow anonymous read (for form), admin full access
CREATE POLICY "Allow anonymous read staff_members" ON staff_members
  FOR SELECT USING (true);

CREATE POLICY "Allow admin manage staff_members" ON staff_members
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE admin_users.email = auth.jwt() ->> 'email'
    )
  );

CREATE POLICY "Allow anonymous read channels" ON channels
  FOR SELECT USING (true);

CREATE POLICY "Allow admin manage channels" ON channels
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE admin_users.email = auth.jwt() ->> 'email'
    )
  );

CREATE POLICY "Allow anonymous read categories" ON categories
  FOR SELECT USING (true);

CREATE POLICY "Allow admin manage categories" ON categories
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE admin_users.email = auth.jwt() ->> 'email'
    )
  );

CREATE POLICY "Allow anonymous read branches" ON branches
  FOR SELECT USING (true);

CREATE POLICY "Allow admin manage branches" ON branches
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE admin_users.email = auth.jwt() ->> 'email'
    )
  );

-- Create indexes
CREATE INDEX idx_staff_members_active ON staff_members(active, display_order);
CREATE INDEX idx_channels_active ON channels(active, display_order);
CREATE INDEX idx_categories_active ON categories(active, display_order);
CREATE INDEX idx_branches_active ON branches(active, display_order);

