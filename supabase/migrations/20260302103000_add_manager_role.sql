alter type admin_role add value if not exists 'manager';

alter table admin_users
add column if not exists display_name text;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
	select exists (
		select 1
		from public.admin_users
		where id = auth.uid()
	);
$$;

grant execute on function public.is_admin() to authenticated;

drop policy if exists "Super admin can manage categories" on categories;
drop policy if exists "Admin can manage categories" on categories;
create policy "Admin can manage categories"
on categories
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Super admin can manage menu items" on menu_items;
drop policy if exists "Admin can manage menu items" on menu_items;
create policy "Admin can manage menu items"
on menu_items
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Super admin can manage menu variants" on menu_variants;
drop policy if exists "Admin can manage menu variants" on menu_variants;
create policy "Admin can manage menu variants"
on menu_variants
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Super admin can manage menu media" on menu_media;
drop policy if exists "Admin can manage menu media" on menu_media;
create policy "Admin can manage menu media"
on menu_media
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Super admin can manage orders" on orders;
drop policy if exists "Admin can manage orders" on orders;
create policy "Admin can manage orders"
on orders
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Super admin can manage order items" on order_items;
drop policy if exists "Admin can manage order items" on order_items;
create policy "Admin can manage order items"
on order_items
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Super admin can manage order status logs" on order_status_logs;
drop policy if exists "Admin can manage order status logs" on order_status_logs;
create policy "Admin can manage order status logs"
on order_status_logs
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Super admin can manage reviews" on reviews;
drop policy if exists "Admin can manage reviews" on reviews;
create policy "Admin can manage reviews"
on reviews
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Super admin can manage blocked ips" on blocked_ips;
drop policy if exists "Admin can manage blocked ips" on blocked_ips;
create policy "Admin can manage blocked ips"
on blocked_ips
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Super admin can manage menu media objects" on storage.objects;
drop policy if exists "Admin can manage menu media objects" on storage.objects;
create policy "Admin can manage menu media objects"
on storage.objects
for all
to authenticated
using (bucket_id = 'menu-media' and public.is_admin())
with check (bucket_id = 'menu-media' and public.is_admin());
