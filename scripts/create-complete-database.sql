-- Create complete database schema for skincare e-commerce

-- Categories table
CREATE TABLE IF NOT EXISTS public.categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    image_url VARCHAR(500),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Products table
CREATE TABLE IF NOT EXISTS public.products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    original_price DECIMAL(10,2),
    category_id INTEGER REFERENCES public.categories(id),
    image_url VARCHAR(500),
    images TEXT[], -- Array of image URLs
    stock INTEGER DEFAULT 0,
    is_featured BOOLEAN DEFAULT FALSE,
    is_flash_sale BOOLEAN DEFAULT FALSE,
    flash_sale_price DECIMAL(10,2),
    flash_sale_end TIMESTAMP WITH TIME ZONE,
    brand VARCHAR(255),
    ingredients TEXT,
    skin_type VARCHAR(100),
    benefits TEXT[],
    how_to_use TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Orders table
CREATE TABLE IF NOT EXISTS public.orders (
    id SERIAL PRIMARY KEY,
    customer_name VARCHAR(255) NOT NULL,
    customer_email VARCHAR(255) NOT NULL,
    customer_phone VARCHAR(50),
    customer_address TEXT,
    customer_city VARCHAR(100),
    customer_region VARCHAR(100),
    delivery_method VARCHAR(50) NOT NULL, -- 'pickup' or 'delivery'
    payment_method VARCHAR(50) NOT NULL,
    payment_status VARCHAR(50) DEFAULT 'pending',
    order_status VARCHAR(50) DEFAULT 'pending',
    subtotal DECIMAL(10,2) NOT NULL,
    shipping_cost DECIMAL(10,2) DEFAULT 0,
    total DECIMAL(10,2) NOT NULL,
    notes TEXT,
    mercadopago_payment_id VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Order items table
CREATE TABLE IF NOT EXISTS public.order_items (
    id SERIAL PRIMARY KEY,
    order_id INTEGER REFERENCES public.orders(id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES public.products(id),
    product_name VARCHAR(255) NOT NULL,
    product_price DECIMAL(10,2) NOT NULL,
    quantity INTEGER NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Admin users table (already exists but ensuring it's complete)
CREATE TABLE IF NOT EXISTS public.admin_users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Settings table for admin configuration
CREATE TABLE IF NOT EXISTS public.settings (
    id SERIAL PRIMARY KEY,
    key VARCHAR(255) UNIQUE NOT NULL,
    value TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default admin user if not exists
INSERT INTO public.admin_users (email, password, name) 
VALUES ('admin@skincarepro.com', 'admin123', 'Administrador')
ON CONFLICT (email) DO NOTHING;

-- Insert default categories
INSERT INTO public.categories (name, description, image_url) VALUES
('Limpiadores', 'Productos para limpiar y purificar la piel', '/placeholder.svg?height=200&width=200'),
('Hidratantes', 'Cremas y lociones hidratantes para todo tipo de piel', '/placeholder.svg?height=200&width=200'),
('Serums', 'Tratamientos concentrados para problemas específicos', '/placeholder.svg?height=200&width=200'),
('Protectores Solares', 'Protección UV para el cuidado diario', '/placeholder.svg?height=200&width=200'),
('Mascarillas', 'Tratamientos intensivos para el rostro', '/placeholder.svg?height=200&width=200'),
('Contorno de Ojos', 'Cuidado específico para la zona del contorno de ojos', '/placeholder.svg?height=200&width=200')
ON CONFLICT DO NOTHING;

-- Insert sample products
INSERT INTO public.products (name, description, price, original_price, category_id, image_url, stock, is_featured, brand, skin_type) VALUES
('Limpiador Facial Suave', 'Limpiador facial suave para uso diario, ideal para todo tipo de piel', 15990, 19990, 1, '/placeholder.svg?height=300&width=300', 50, true, 'SkinCare Pro', 'Todo tipo'),
('Crema Hidratante Anti-Edad', 'Crema hidratante con ingredientes anti-edad para piel madura', 35990, 45990, 2, '/placeholder.svg?height=300&width=300', 30, true, 'SkinCare Pro', 'Madura'),
('Serum Vitamina C', 'Serum concentrado con vitamina C para iluminar la piel', 28990, NULL, 3, '/placeholder.svg?height=300&width=300', 25, false, 'SkinCare Pro', 'Todo tipo'),
('Protector Solar FPS 50', 'Protector solar de amplio espectro con FPS 50', 22990, NULL, 4, '/placeholder.svg?height=300&width=300', 40, true, 'SkinCare Pro', 'Todo tipo'),
('Mascarilla Purificante', 'Mascarilla de arcilla para purificar y limpiar los poros', 18990, 24990, 5, '/placeholder.svg?height=300&width=300', 20, false, 'SkinCare Pro', 'Grasa'),
('Crema Contorno de Ojos', 'Crema específica para reducir ojeras y líneas de expresión', 32990, NULL, 6, '/placeholder.svg?height=300&width=300', 15, false, 'SkinCare Pro', 'Todo tipo')
ON CONFLICT DO NOTHING;

-- Insert default settings
INSERT INTO public.settings (key, value) VALUES
('admin_email', 'admin@skincarepro.com'),
('store_name', 'SkinCare Pro'),
('store_phone', '+56 9 1234 5678'),
('store_address', 'Santiago, Chile'),
('mercadopago_enabled', 'true'),
('email_notifications', 'true')
ON CONFLICT (key) DO NOTHING;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_featured ON public.products(is_featured);
CREATE INDEX IF NOT EXISTS idx_products_flash_sale ON public.products(is_flash_sale);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(order_status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);
