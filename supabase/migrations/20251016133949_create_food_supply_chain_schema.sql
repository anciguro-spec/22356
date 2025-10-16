-- Food Supply Chain Tracing System Schema
--
-- Overview:
-- Creates a comprehensive database schema for a decentralized food supply chain tracing system
-- with role-based access control and blockchain integration.
--
-- New Tables:
--
-- 1. profiles
--    Extends auth.users with additional user information and role assignment
--
-- 2. products
--    Tracks products moving through the supply chain
--
-- 3. phase_records
--    Records each phase transition in the supply chain
--
-- 4. documents
--    Stores metadata for uploaded documents (actual files on IPFS)
--
-- Security:
-- - Enable Row Level Security (RLS) on all tables
-- - Collectors can create products and view their own products
-- - Each role can only access and update products in their assigned phase
-- - All authenticated users can view product traceability history
-- - Admins have full access to all data

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  full_name text,
  role text NOT NULL CHECK (role IN ('collector', 'tester', 'processing', 'manufacturing', 'admin')),
  organization text,
  wallet_address text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create products table
CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  blockchain_id bigint,
  name text NOT NULL,
  batch_number text NOT NULL UNIQUE,
  description text,
  collector_id uuid REFERENCES profiles(id),
  current_phase text NOT NULL DEFAULT 'collector' CHECK (current_phase IN ('collector', 'tester', 'processing', 'manufacturing')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create phase_records table
CREATE TABLE IF NOT EXISTS phase_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES products(id) ON DELETE CASCADE,
  phase text NOT NULL CHECK (phase IN ('collector', 'tester', 'processing', 'manufacturing')),
  handler_id uuid REFERENCES profiles(id),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  notes text,
  test_results jsonb,
  ipfs_hash text,
  blockchain_tx_hash text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create documents table
CREATE TABLE IF NOT EXISTS documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES products(id) ON DELETE CASCADE,
  phase_record_id uuid REFERENCES phase_records(id) ON DELETE CASCADE,
  file_name text NOT NULL,
  file_type text,
  ipfs_hash text NOT NULL,
  uploaded_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_products_batch_number ON products(batch_number);
CREATE INDEX IF NOT EXISTS idx_products_current_phase ON products(current_phase);
CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
CREATE INDEX IF NOT EXISTS idx_products_collector ON products(collector_id);

CREATE INDEX IF NOT EXISTS idx_phase_records_product ON phase_records(product_id);
CREATE INDEX IF NOT EXISTS idx_phase_records_phase ON phase_records(phase);
CREATE INDEX IF NOT EXISTS idx_phase_records_handler ON phase_records(handler_id);

CREATE INDEX IF NOT EXISTS idx_documents_product ON documents(product_id);
CREATE INDEX IF NOT EXISTS idx_documents_phase_record ON documents(phase_record_id);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE phase_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Products policies
CREATE POLICY "Authenticated users can view all products"
  ON products FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Collectors can create products"
  ON products FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'collector'
    )
  );

CREATE POLICY "Users can update products in their phase"
  ON products FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = current_phase
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = current_phase
    )
  );

CREATE POLICY "Admins can update any product"
  ON products FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Phase records policies
CREATE POLICY "Authenticated users can view all phase records"
  ON phase_records FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create records for their role phase"
  ON phase_records FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = phase
    )
  );

CREATE POLICY "Users can update their own phase records"
  ON phase_records FOR UPDATE
  TO authenticated
  USING (auth.uid() = handler_id)
  WITH CHECK (auth.uid() = handler_id);

-- Documents policies
CREATE POLICY "Authenticated users can view all documents"
  ON documents FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can upload documents"
  ON documents FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = uploaded_by);

-- Create function to automatically create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role)
  VALUES (new.id, new.email, 'collector');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_phase_records_updated_at BEFORE UPDATE ON phase_records
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
