-- Create admin user if it doesn't exist
INSERT INTO admin_users (name, email, password, created_at)
VALUES ('Admin', 'admin@skincarepro.com', 'admin123', NOW())
ON CONFLICT (email) DO NOTHING;

-- Verify admin user exists
SELECT * FROM admin_users WHERE email = 'admin@skincarepro.com';
