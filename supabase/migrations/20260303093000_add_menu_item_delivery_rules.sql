alter table if exists menu_items
add column if not exists is_main_dish boolean not null default false,
add column if not exists block_today boolean not null default false,
add column if not exists block_today_reason text,
add column if not exists blocked_delivery_dates date[] not null default '{}'::date[],
add column if not exists blocked_delivery_date_reasons jsonb not null default '{}'::jsonb;
