create type promotion_type as enum ('fixed_amount', 'percentage');

create table if not exists promotions (
	id uuid primary key default gen_random_uuid(),
	code text not null unique,
	type promotion_type not null,
	discount_value int not null check (discount_value > 0),
	max_discount_amount int check (max_discount_amount is null or max_discount_amount >= 0),
	min_order_amount int not null default 0 check (min_order_amount >= 0),
	max_usage int check (max_usage is null or max_usage > 0),
	used_count int not null default 0 check (used_count >= 0),
	valid_from timestamptz not null,
	valid_until timestamptz not null,
	is_active boolean not null default true,
	created_by uuid references admin_users(id) on delete set null,
	created_at timestamptz not null default now(),
	updated_at timestamptz not null default now(),
	constraint promotions_valid_range_check check (valid_from < valid_until),
	constraint promotions_percentage_rules_check check (
		(type = 'fixed_amount' and max_discount_amount is null)
		or (type = 'percentage' and discount_value <= 100 and max_discount_amount is not null)
	)
);

create table if not exists promotion_usages (
	id uuid primary key default gen_random_uuid(),
	promotion_id uuid not null references promotions(id) on delete restrict,
	order_id uuid not null unique references orders(id) on delete cascade,
	discount_amount int not null check (discount_amount >= 0),
	created_at timestamptz not null default now()
);

alter table orders
add column if not exists promotion_id uuid references promotions(id) on delete set null,
add column if not exists discount_amount int not null default 0 check (discount_amount >= 0);

create index if not exists idx_promotions_code on promotions(code);
create index if not exists idx_promotions_is_active on promotions(is_active);
create index if not exists idx_promotion_usages_order_id on promotion_usages(order_id);
create index if not exists idx_promotion_usages_promotion_id on promotion_usages(promotion_id);

drop trigger if exists trigger_update_promotions_updated_at on promotions;
create trigger trigger_update_promotions_updated_at
before update on promotions
for each row
execute function update_updated_at_column();

create or replace function public.try_consume_promotion(
	p_promotion_id uuid,
	p_now timestamptz default now()
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
	v_consumed_id uuid;
begin
	update promotions
	set used_count = used_count + 1
	where id = p_promotion_id
		and is_active = true
		and valid_from <= p_now
		and valid_until >= p_now
		and (max_usage is null or used_count < max_usage)
	returning id into v_consumed_id;

	return v_consumed_id is not null;
end;
$$;

create or replace function public.release_promotion_usage(
	p_order_id uuid,
	p_now timestamptz default now()
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
	v_promotion_id uuid;
	v_is_active boolean;
	v_valid_until timestamptz;
begin
	select pu.promotion_id, p.is_active, p.valid_until
	into v_promotion_id, v_is_active, v_valid_until
	from promotion_usages pu
	join promotions p on p.id = pu.promotion_id
	where pu.order_id = p_order_id
	for update;

	if v_promotion_id is null then
		return false;
	end if;

	if v_is_active is not true or v_valid_until < p_now then
		return false;
	end if;

	update promotions
	set used_count = greatest(used_count - 1, 0)
	where id = v_promotion_id;

	delete from promotion_usages
	where order_id = p_order_id;

	return true;
end;
$$;

grant execute on function public.try_consume_promotion(uuid, timestamptz) to anon, authenticated;
grant execute on function public.release_promotion_usage(uuid, timestamptz) to anon, authenticated;

alter table promotions enable row level security;
alter table promotion_usages enable row level security;

drop policy if exists "Admin can manage promotions" on promotions;
create policy "Admin can manage promotions"
on promotions
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Admin can manage promotion usages" on promotion_usages;
create policy "Admin can manage promotion usages"
on promotion_usages
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());
