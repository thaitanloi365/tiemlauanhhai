alter table orders
add column if not exists customer_last_seen_message_at timestamptz,
add column if not exists admin_last_seen_message_at timestamptz;
