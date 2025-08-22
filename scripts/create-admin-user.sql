-- Updated to work with Supabase auth system instead of custom admin_users table
-- This script is no longer needed as we're using Supabase's built-in authentication
-- The admin user will be created automatically when logging in with admin@skincarepro.com / admin123

-- Keep the admin_users table for reference but it's not used in the new auth system
CREATE TABLE IF NOT EXISTS admin_users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  name VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default admin user (for reference only)
INSERT INTO admin_users (email, password, name) 
VALUES ('admin@skincarepro.com', 'admin123', 'Administrador')
ON CONFLICT (email) DO NOTHING;

-- Note: The actual authentication now uses Supabase's auth.users table
-- Admin users are created automatically when they first log in
