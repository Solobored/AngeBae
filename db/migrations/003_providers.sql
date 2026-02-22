-- Providers multi-tenant support (idempotent)

-- Users table (separate from admins)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT,
  is_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Providers
CREATE TABLE IF NOT EXISTS providers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id UUID REFERENCES users(id),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  logo_url TEXT,
  banner_url TEXT,
  favicon_url TEXT,
  theme JSONB,
  contact_info JSONB,
  is_verified BOOLEAN DEFAULT false,
  is_published BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Provider users
CREATE TABLE IF NOT EXISTS provider_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('owner', 'manager')),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (provider_id, user_id)
);

-- Brand settings
CREATE TABLE IF NOT EXISTS brand_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID NOT NULL UNIQUE REFERENCES providers(id) ON DELETE CASCADE,
  logo_url TEXT,
  favicon_url TEXT,
  banner_url TEXT,
  site_title TEXT,
  subtitle TEXT,
  colors JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Products: provider_id
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS provider_id UUID;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'products_provider_id_fkey'
  ) THEN
    ALTER TABLE products
      ADD CONSTRAINT products_provider_id_fkey FOREIGN KEY (provider_id) REFERENCES providers(id) ON DELETE SET NULL;
  END IF;
END$$;

-- Media: provider_id
ALTER TABLE media
  ADD COLUMN IF NOT EXISTS provider_id UUID;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'media_provider_id_fkey'
  ) THEN
    ALTER TABLE media
      ADD CONSTRAINT media_provider_id_fkey FOREIGN KEY (provider_id) REFERENCES providers(id) ON DELETE SET NULL;
  END IF;
END$$;

-- OCR jobs: provider_id
ALTER TABLE ocr_jobs
  ADD COLUMN IF NOT EXISTS provider_id UUID;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'ocr_jobs_provider_id_fkey'
  ) THEN
    ALTER TABLE ocr_jobs
      ADD CONSTRAINT ocr_jobs_provider_id_fkey FOREIGN KEY (provider_id) REFERENCES providers(id) ON DELETE SET NULL;
  END IF;
END$$;

-- Product candidates: provider_id
ALTER TABLE product_candidates
  ADD COLUMN IF NOT EXISTS provider_id UUID;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'product_candidates_provider_id_fkey'
  ) THEN
    ALTER TABLE product_candidates
      ADD CONSTRAINT product_candidates_provider_id_fkey FOREIGN KEY (provider_id) REFERENCES providers(id) ON DELETE SET NULL;
  END IF;
END$$;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_providers_slug ON providers(slug);
CREATE INDEX IF NOT EXISTS idx_products_provider_id ON products(provider_id);
CREATE INDEX IF NOT EXISTS idx_media_provider_id ON media(provider_id);
CREATE INDEX IF NOT EXISTS idx_ocr_jobs_provider_id ON ocr_jobs(provider_id);
CREATE INDEX IF NOT EXISTS idx_product_candidates_provider_id ON product_candidates(provider_id);

-- Trigger helpers for updated_at (use $fn$ to avoid nested $$ parsing issues)
DO $migrate$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'set_timestamp') THEN
    CREATE OR REPLACE FUNCTION set_timestamp()
    RETURNS TRIGGER AS $fn$
    BEGIN
      NEW.updated_at = now();
      RETURN NEW;
    END;
    $fn$ LANGUAGE plpgsql;
  END IF;
END $migrate$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_providers_set_timestamp'
  ) THEN
    CREATE TRIGGER trg_providers_set_timestamp
      BEFORE UPDATE ON providers
      FOR EACH ROW EXECUTE PROCEDURE set_timestamp();
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_users_set_timestamp'
  ) THEN
    CREATE TRIGGER trg_users_set_timestamp
      BEFORE UPDATE ON users
      FOR EACH ROW EXECUTE PROCEDURE set_timestamp();
  END IF;
END$$;

