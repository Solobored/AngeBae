-- Actualizar la estructura de la base de datos para mejorar funcionalidad

-- Agregar campos faltantes a la tabla de productos
ALTER TABLE products ADD COLUMN IF NOT EXISTS rating DECIMAL(3,2) DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS reviews_count INTEGER DEFAULT 0;

-- Crear tabla de usuarios admin si no existe
CREATE TABLE IF NOT EXISTS admin_users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(200) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(100) NOT NULL,
    role VARCHAR(20) DEFAULT 'admin',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Actualizar datos de ejemplo con ratings
UPDATE products SET rating = 4.8, reviews_count = 124 WHERE name = 'Serum Vitamina C Antioxidante';
UPDATE products SET rating = 4.6, reviews_count = 89 WHERE name = 'Crema Hidratante Ácido Hialurónico';
UPDATE products SET rating = 4.5, reviews_count = 67 WHERE name = 'Limpiador Facial Suave';
UPDATE products SET rating = 4.4, reviews_count = 45 WHERE name = 'Mascarilla Purificante Arcilla';
UPDATE products SET rating = 4.7, reviews_count = 156 WHERE name = 'Protector Solar FPS 50';
UPDATE products SET rating = 4.3, reviews_count = 78 WHERE name = 'Tónico Equilibrante';

-- Crear índices adicionales para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_products_rating ON products(rating);
CREATE INDEX IF NOT EXISTS idx_products_price ON products(price);
CREATE INDEX IF NOT EXISTS idx_orders_customer_email ON orders(customer_email);
CREATE INDEX IF NOT EXISTS idx_orders_customer_phone ON orders(customer_phone);
