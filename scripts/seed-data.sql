-- Insertar categorías iniciales
INSERT INTO categories (name, slug, description) VALUES
('Serums', 'serums', 'Serums concentrados para tratamientos específicos'),
('Cremas', 'cremas', 'Cremas hidratantes y nutritivas'),
('Limpiadores', 'limpiadores', 'Productos para limpieza facial'),
('Mascarillas', 'mascarillas', 'Mascarillas faciales para diferentes tipos de piel'),
('Protección Solar', 'proteccion-solar', 'Protectores solares y productos con FPS'),
('Tónicos', 'tonicos', 'Tónicos y astringentes para equilibrar la piel');

-- Insertar productos de ejemplo
INSERT INTO products (name, slug, description, price, original_price, image_url, category_id, stock, is_flash_sale, is_best_seller, rating, reviews_count) VALUES
('Serum Vitamina C Antioxidante', 'serum-vitamina-c', 'Serum concentrado con vitamina C para iluminar y proteger la piel del daño oxidativo', 2500.00, 3200.00, '/placeholder.svg?height=300&width=300', 1, 15, true, true, 4.8, 124),
('Crema Hidratante Ácido Hialurónico', 'crema-acido-hialuronico', 'Crema ultra hidratante con ácido hialurónico para todo tipo de piel', 1800.00, NULL, '/placeholder.svg?height=300&width=300', 2, 8, false, true, 4.6, 89),
('Limpiador Facial Suave', 'limpiador-facial-suave', 'Limpiador suave para uso diario, apto para pieles sensibles', 1200.00, NULL, '/placeholder.svg?height=300&width=300', 3, 0, false, false, 4.5, 67),
('Mascarilla Purificante Arcilla', 'mascarilla-arcilla', 'Mascarilla de arcilla para purificar y minimizar poros', 1500.00, 1800.00, '/placeholder.svg?height=300&width=300', 4, 12, true, false, 4.4, 45),
('Protector Solar FPS 50', 'protector-solar-fps50', 'Protector solar de amplio espectro, textura ligera', 2200.00, NULL, '/placeholder.svg?height=300&width=300', 5, 20, false, true, 4.7, 156),
('Tónico Equilibrante', 'tonico-equilibrante', 'Tónico sin alcohol para equilibrar el pH de la piel', 1400.00, NULL, '/placeholder.svg?height=300&width=300', 6, 18, false, false, 4.3, 78);

-- Insertar algunos pedidos de ejemplo
INSERT INTO orders (order_number, customer_email, contact_method, shipping_method, shipping_cost, subtotal, total, status) VALUES
('ORD-001', 'maria@email.com', 'email', 'pickup', 0.00, 4300.00, 4300.00, 'pending'),
('ORD-002', NULL, 'phone', 'delivery', 500.00, 2500.00, 3000.00, 'completed'),
('ORD-003', 'ana.garcia@email.com', 'email', 'pickup', 0.00, 6800.00, 6800.00, 'processing');

-- Insertar items de los pedidos
INSERT INTO order_items (order_id, product_id, product_name, product_price, quantity, subtotal) VALUES
(1, 1, 'Serum Vitamina C Antioxidante', 2500.00, 1, 2500.00),
(1, 2, 'Crema Hidratante Ácido Hialurónico', 1800.00, 1, 1800.00),
(2, 1, 'Serum Vitamina C Antioxidante', 2500.00, 1, 2500.00),
(3, 1, 'Serum Vitamina C Antioxidante', 2500.00, 1, 2500.00),
(3, 2, 'Crema Hidratante Ácido Hialurónico', 1800.00, 1, 1800.00),
(3, 5, 'Protector Solar FPS 50', 2200.00, 1, 2200.00),
(3, 6, 'Tónico Equilibrante', 1400.00, 2, 2800.00);

-- Actualizar el número de teléfono para el pedido 2
UPDATE orders SET customer_phone = '+54 9 11 2345-6789' WHERE id = 2;
