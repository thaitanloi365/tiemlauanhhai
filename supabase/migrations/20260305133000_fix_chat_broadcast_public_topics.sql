create or replace function public.broadcast_order_messages_changes()
returns trigger
security definer
set search_path = ''
as $$
begin
  perform realtime.send(
    jsonb_build_object(
      'schema', tg_table_schema,
      'table', tg_table_name,
      'operation', 'INSERT',
      'order_id', new.order_id
    ),
    'ORDER_MESSAGE_INSERT',
    'order:' || new.order_id::text,
    false
  );

  perform realtime.send(
    jsonb_build_object(
      'schema', tg_table_schema,
      'table', tg_table_name,
      'operation', 'INSERT',
      'order_id', new.order_id
    ),
    'ORDER_MESSAGE_INSERT',
    'admin-chat',
    false
  );

  return null;
end;
$$ language plpgsql;

create or replace function public.broadcast_order_chat_orders_changes()
returns trigger
security definer
set search_path = ''
as $$
begin
  perform realtime.send(
    jsonb_build_object(
      'schema', tg_table_schema,
      'table', tg_table_name,
      'operation', tg_op,
      'order_id', new.id
    ),
    'ORDER_UPDATED',
    'order:' || new.id::text,
    false
  );

  perform realtime.send(
    jsonb_build_object(
      'schema', tg_table_schema,
      'table', tg_table_name,
      'operation', tg_op,
      'order_id', new.id
    ),
    'ORDER_UPDATED',
    'admin-chat',
    false
  );

  return null;
end;
$$ language plpgsql;

drop trigger if exists broadcast_order_messages_changes_trigger on public.order_messages;
create trigger broadcast_order_messages_changes_trigger
after insert on public.order_messages
for each row
execute function public.broadcast_order_messages_changes();

drop trigger if exists broadcast_order_chat_orders_changes_trigger on public.orders;
create trigger broadcast_order_chat_orders_changes_trigger
after update on public.orders
for each row
when (
  old.status is distinct from new.status
  or old.customer_last_seen_message_at is distinct from new.customer_last_seen_message_at
  or old.admin_last_seen_message_at is distinct from new.admin_last_seen_message_at
)
execute function public.broadcast_order_chat_orders_changes();
