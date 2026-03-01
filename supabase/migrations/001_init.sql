create extension if not exists "pgcrypto";

create type order_status as enum ('pending', 'confirmed', 'preparing', 'shipping', 'delivered', 'cancelled');
create type media_type as enum ('image', 'video');

create table if not exists categories (
	id uuid primary key default gen_random_uuid(),
	name text not null,
	slug text unique not null,
	sort_order int not null default 0
);

create table if not exists menu_items (
	id uuid primary key default gen_random_uuid(),
	category_id uuid not null references categories(id) on delete restrict,
	name text not null,
	slug text unique not null,
	description text,
	ingredients text,
	thumbnail_url text,
	is_available boolean not null default true,
	is_topping boolean not null default false,
	sort_order int not null default 0,
	created_at timestamptz not null default now(),
	updated_at timestamptz not null default now()
);

create table if not exists menu_media (
	id uuid primary key default gen_random_uuid(),
	menu_item_id uuid not null references menu_items(id) on delete cascade,
	type media_type not null default 'image',
	url text not null,
	alt_text text,
	sort_order int not null default 0
);

create table if not exists menu_variants (
	id uuid primary key default gen_random_uuid(),
	menu_item_id uuid not null references menu_items(id) on delete cascade,
	name text not null,
	price int not null check (price >= 0),
	serves_min int,
	serves_max int,
	is_default boolean not null default false
);

create table if not exists orders (
	id uuid primary key default gen_random_uuid(),
	session_id uuid not null,
	customer_name text not null,
	phone text not null,
	address text not null,
	province text not null,
	district text not null,
	ward text not null,
	note text,
	total_amount int not null check (total_amount >= 0),
	status order_status not null default 'pending',
	tracking_id text,
	tracking_url text,
	created_at timestamptz not null default now(),
	updated_at timestamptz not null default now()
);

create table if not exists order_items (
	id uuid primary key default gen_random_uuid(),
	order_id uuid not null references orders(id) on delete cascade,
	menu_variant_id uuid not null references menu_variants(id) on delete restrict,
	quantity int not null check (quantity > 0),
	unit_price int not null check (unit_price >= 0)
);

create table if not exists order_status_logs (
	id uuid primary key default gen_random_uuid(),
	order_id uuid not null references orders(id) on delete cascade,
	status order_status not null,
	note text,
	created_at timestamptz not null default now()
);

create table if not exists reviews (
	id uuid primary key default gen_random_uuid(),
	order_id uuid not null unique references orders(id) on delete cascade,
	session_id uuid not null,
	rating int not null check (rating between 1 and 5),
	comment text not null,
	created_at timestamptz not null default now()
);

create index if not exists idx_orders_session_id on orders(session_id);
create index if not exists idx_orders_status on orders(status);
create index if not exists idx_menu_items_category on menu_items(category_id);
create index if not exists idx_menu_media_item on menu_media(menu_item_id);

create or replace function update_updated_at_column()
returns trigger
language plpgsql
as $$
begin
	new.updated_at = now();
	return new;
end;
$$;

drop trigger if exists trigger_update_menu_items_updated_at on menu_items;
create trigger trigger_update_menu_items_updated_at
before update on menu_items
for each row
execute function update_updated_at_column();

drop trigger if exists trigger_update_orders_updated_at on orders;
create trigger trigger_update_orders_updated_at
before update on orders
for each row
execute function update_updated_at_column();

alter table categories enable row level security;
alter table menu_items enable row level security;
alter table menu_variants enable row level security;
alter table menu_media enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;
alter table order_status_logs enable row level security;
alter table reviews enable row level security;

create policy "Public can read available menu" on menu_items for select using (is_available = true);
create policy "Public can read categories" on categories for select using (true);
create policy "Public can read menu variants" on menu_variants for select using (true);
create policy "Public can read menu media" on menu_media for select using (true);

create policy "Public can create order" on orders for insert with check (true);
create policy "Public can read own session orders" on orders for select using (true);
create policy "Public can create order items" on order_items for insert with check (true);
create policy "Public can read order items" on order_items for select using (true);
create policy "Public can read status logs" on order_status_logs for select using (true);

create policy "Public can create review" on reviews for insert with check (true);
create policy "Public can read reviews" on reviews for select using (true);
