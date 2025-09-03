-- -------------------------------
-- Table: products
-- -------------------------------
create table if not exists products (
    id bigserial primary key,
    name text not null,
    description text,
    image_url text,
    price numeric(10,2) not null,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

-- -------------------------------
-- Table: offers
-- -------------------------------
create table if not exists offers (
    id bigserial primary key,
    product_id bigint not null references products(id) on delete cascade,
    offer_price numeric(10,2) not null,
    discount_percentage numeric(5,2),
    start_date timestamptz not null,
    end_date timestamptz not null,
    is_active boolean default true,
    position int default 1,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

-- Index for active offers query
create index if not exists idx_offers_active_dates
    on offers (is_active, start_date, end_date);

-- -------------------------------
-- Table: orders
-- -------------------------------
create table if not exists orders (
    id bigserial primary key,
    order_number text not null unique,
    customer_name text not null,
    customer_email text not null,
    customer_phone text,
    customer_address text,
    delivery_method text,
    items jsonb not null, -- array of items {product_id, quantity, price, subtotal}
    total numeric(10,2) not null,
    status text default 'pending', -- pending, paid, shipped, completed, canceled
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

-- -------------------------------
-- Table: order_items
-- -------------------------------
create table if not exists order_items (
    id bigserial primary key,
    order_id bigint not null references orders(id) on delete cascade,
    product_id bigint not null references products(id),
    product_name text not null,
    product_price numeric(10,2) not null,
    quantity int not null,
    subtotal numeric(10,2) not null,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

-- Index for fetching recent orders
create index if not exists idx_orders_created_at
    on orders (created_at desc);
