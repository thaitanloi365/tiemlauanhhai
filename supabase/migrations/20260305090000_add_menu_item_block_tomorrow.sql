alter table if exists menu_items
add column if not exists block_tomorrow boolean not null default false,
add column if not exists block_tomorrow_reason text;
