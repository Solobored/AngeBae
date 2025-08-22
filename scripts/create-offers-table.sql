-- Create offers table for dynamic offers carousel
CREATE TABLE IF NOT EXISTS offers (
  id SERIAL PRIMARY KEY,
  product_id INTEGER NOT NULL,
  offer_price DECIMAL(10,2) NOT NULL,
  discount_percentage INTEGER NOT NULL,
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  is_active BOOLEAN DEFAULT true,
  position INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_offers_active_dates ON offers(is_active, start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_offers_position ON offers(position);

-- Insert sample offers data
INSERT INTO offers (product_id, offer_price, discount_percentage, start_date, end_date, is_active, position) VALUES
(1, 2500, 22, NOW() - INTERVAL '1 day', NOW() + INTERVAL '7 days', true, 1),
(4, 1500, 17, NOW() - INTERVAL '1 day', NOW() + INTERVAL '5 days', true, 2),
(5, 1980, 10, NOW() - INTERVAL '2 days', NOW() + INTERVAL '10 days', true, 3)
ON CONFLICT DO NOTHING;

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for offers table
DROP TRIGGER IF EXISTS update_offers_updated_at ON offers;
CREATE TRIGGER update_offers_updated_at
    BEFORE UPDATE ON offers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
