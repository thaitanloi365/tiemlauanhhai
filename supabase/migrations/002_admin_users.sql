create type admin_role as enum ('super_admin');

create table if not exists admin_users (
	id uuid primary key references auth.users(id) on delete cascade,
	email text not null unique,
	role admin_role not null default 'super_admin',
	created_at timestamptz not null default now()
);

alter table admin_users enable row level security;

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
