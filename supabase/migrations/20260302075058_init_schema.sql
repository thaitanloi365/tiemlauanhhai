create extension if not exists "pgcrypto";

create type order_status as enum ('pending', 'confirmed', 'preparing', 'shipping', 'delivered', 'cancelled');
create type media_type as enum ('image', 'video');
create type admin_role as enum ('super_admin');

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
	note text,
	preparation_time_minutes int,
	thumbnail_url text,
	is_available boolean not null default true,
	is_topping boolean not null default false,
	sort_order int not null default 0,
	created_at timestamptz not null default now(),
	updated_at timestamptz not null default now(),
	constraint menu_items_preparation_time_minutes_check
		check (preparation_time_minutes is null or preparation_time_minutes >= 0)
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
	scheduled_for timestamptz,
	expired_at timestamptz,
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

create table if not exists admin_users (
	id uuid primary key references auth.users(id) on delete cascade,
	email text not null unique,
	role admin_role not null default 'super_admin',
	created_at timestamptz not null default now()
);

create table if not exists blocked_ips (
	id uuid primary key default gen_random_uuid(),
	ip_address text not null unique,
	reason text,
	blocked_by uuid references admin_users(id) on delete set null,
	expires_at timestamptz,
	created_at timestamptz not null default now()
);

create table if not exists area_subscribers (
	id uuid primary key default gen_random_uuid(),
	email text not null,
	province text not null,
	district text,
	created_at timestamptz not null default now(),
	unique (email, province)
);

create index if not exists idx_orders_session_id on orders(session_id);
create index if not exists idx_orders_status on orders(status);
create index if not exists idx_orders_expired_at on orders(expired_at) where expired_at is not null;
create index if not exists idx_menu_items_category on menu_items(category_id);
create index if not exists idx_menu_media_item on menu_media(menu_item_id);
create index if not exists idx_blocked_ips_ip_address on blocked_ips(ip_address);
create index if not exists idx_blocked_ips_expires_at on blocked_ips(expires_at);
create index if not exists idx_area_subscribers_province on area_subscribers(province);

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
alter table admin_users enable row level security;
alter table blocked_ips enable row level security;

create or replace function public.is_super_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
	select exists (
		select 1
		from public.admin_users
		where id = auth.uid() and role = 'super_admin'
	);
$$;

grant execute on function public.is_super_admin() to authenticated;

drop policy if exists "Public can read available menu" on menu_items;
create policy "Public can read available menu" on menu_items for select using (is_available = true);

drop policy if exists "Public can read categories" on categories;
create policy "Public can read categories" on categories for select using (true);

drop policy if exists "Public can read menu variants" on menu_variants;
create policy "Public can read menu variants" on menu_variants for select using (true);

drop policy if exists "Public can read menu media" on menu_media;
create policy "Public can read menu media" on menu_media for select using (true);

drop policy if exists "Public can create order" on orders;
create policy "Public can create order" on orders for insert with check (true);

drop policy if exists "Public can read own session orders" on orders;
create policy "Public can read own session orders" on orders for select using (true);

drop policy if exists "Public can create order items" on order_items;
create policy "Public can create order items" on order_items for insert with check (true);

drop policy if exists "Public can read order items" on order_items;
create policy "Public can read order items" on order_items for select using (true);

drop policy if exists "Public can read status logs" on order_status_logs;
create policy "Public can read status logs" on order_status_logs for select using (true);

drop policy if exists "Public can create review" on reviews;
create policy "Public can create review" on reviews for insert with check (true);

drop policy if exists "Public can read reviews" on reviews;
create policy "Public can read reviews" on reviews for select using (true);

drop policy if exists "Super admin can read admin users" on admin_users;
create policy "Super admin can read admin users"
on admin_users
for select
to authenticated
using (public.is_super_admin());

drop policy if exists "Super admin can manage admin users" on admin_users;
create policy "Super admin can manage admin users"
on admin_users
for all
to authenticated
using (public.is_super_admin())
with check (public.is_super_admin());

drop policy if exists "Super admin can manage categories" on categories;
create policy "Super admin can manage categories"
on categories
for all
to authenticated
using (public.is_super_admin())
with check (public.is_super_admin());

drop policy if exists "Super admin can manage menu items" on menu_items;
create policy "Super admin can manage menu items"
on menu_items
for all
to authenticated
using (public.is_super_admin())
with check (public.is_super_admin());

drop policy if exists "Super admin can manage menu variants" on menu_variants;
create policy "Super admin can manage menu variants"
on menu_variants
for all
to authenticated
using (public.is_super_admin())
with check (public.is_super_admin());

drop policy if exists "Super admin can manage menu media" on menu_media;
create policy "Super admin can manage menu media"
on menu_media
for all
to authenticated
using (public.is_super_admin())
with check (public.is_super_admin());

drop policy if exists "Super admin can manage orders" on orders;
create policy "Super admin can manage orders"
on orders
for all
to authenticated
using (public.is_super_admin())
with check (public.is_super_admin());

drop policy if exists "Super admin can manage order items" on order_items;
create policy "Super admin can manage order items"
on order_items
for all
to authenticated
using (public.is_super_admin())
with check (public.is_super_admin());

drop policy if exists "Super admin can manage order status logs" on order_status_logs;
create policy "Super admin can manage order status logs"
on order_status_logs
for all
to authenticated
using (public.is_super_admin())
with check (public.is_super_admin());

drop policy if exists "Super admin can manage reviews" on reviews;
create policy "Super admin can manage reviews"
on reviews
for all
to authenticated
using (public.is_super_admin())
with check (public.is_super_admin());

drop policy if exists "Super admin can manage blocked ips" on blocked_ips;
create policy "Super admin can manage blocked ips"
on blocked_ips
for all
to authenticated
using (public.is_super_admin())
with check (public.is_super_admin());

insert into storage.buckets (id, name, public)
values ('menu-media', 'menu-media', true)
on conflict (id) do update
set name = excluded.name, public = excluded.public;

drop policy if exists "Super admin can manage menu media objects" on storage.objects;
create policy "Super admin can manage menu media objects"
on storage.objects
for all
to authenticated
using (bucket_id = 'menu-media' and public.is_super_admin())
with check (bucket_id = 'menu-media' and public.is_super_admin());
