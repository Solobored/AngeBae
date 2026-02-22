-- Backward-safe alignment for admin APIs and catalog persistence

ALTER TABLE offers
ADD COLUMN IF NOT EXISTS position INTEGER NOT NULL DEFAULT 1;

ALTER TABLE order_items
ADD COLUMN IF NOT EXISTS product_name VARCHAR(255);

CREATE TABLE IF NOT EXISTS catalog_processing_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_id VARCHAR(255) NOT NULL,
  filename VARCHAR(500) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'completed',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_catalog_processing_runs_file_id
  ON catalog_processing_runs(file_id);

CREATE INDEX IF NOT EXISTS idx_catalog_processing_runs_created_at
  ON catalog_processing_runs(created_at DESC);

CREATE TABLE IF NOT EXISTS catalog_processing_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id UUID NOT NULL REFERENCES catalog_processing_runs(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  original_price DECIMAL(10, 2),
  category VARCHAR(255),
  confidence DECIMAL(5, 2) NOT NULL,
  duplicate BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_catalog_processing_products_run_id
  ON catalog_processing_products(run_id);
