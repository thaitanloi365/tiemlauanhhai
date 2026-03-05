create table if not exists order_messages (
	id uuid primary key default gen_random_uuid(),
	order_id uuid not null references orders(id) on delete cascade,
	sender_type text not null check (sender_type in ('customer', 'admin')),
	sender_id text not null,
	content text,
	images text[] not null default '{}',
	created_at timestamptz not null default now(),
	constraint order_messages_content_or_images_check check (
		coalesce(length(trim(content)), 0) > 0
		or coalesce(array_length(images, 1), 0) > 0
	),
	constraint order_messages_images_limit_check check (
		coalesce(array_length(images, 1), 0) <= 3
	)
);

create index if not exists idx_order_messages_order_id on order_messages(order_id);
create index if not exists idx_order_messages_created_at on order_messages(order_id, created_at);

alter table order_messages enable row level security;

drop policy if exists "Public can read order messages" on order_messages;
create policy "Public can read order messages"
on order_messages
for select
using (true);

drop policy if exists "Public can create order messages" on order_messages;
create policy "Public can create order messages"
on order_messages
for insert
with check (true);

drop policy if exists "Admin can manage order messages" on order_messages;
create policy "Admin can manage order messages"
on order_messages
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

do $$
begin
	alter publication supabase_realtime add table order_messages;
exception
	when duplicate_object then null;
end;
$$;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
	'chat-media',
	'chat-media',
	true,
	5242880,
	array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update
set
	name = excluded.name,
	public = excluded.public,
	file_size_limit = excluded.file_size_limit,
	allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Public can read chat media objects" on storage.objects;
create policy "Public can read chat media objects"
on storage.objects
for select
using (bucket_id = 'chat-media');

drop policy if exists "Public can upload chat media objects" on storage.objects;
create policy "Public can upload chat media objects"
on storage.objects
for insert
with check (bucket_id = 'chat-media');

drop policy if exists "Admin can manage chat media objects" on storage.objects;
create policy "Admin can manage chat media objects"
on storage.objects
for all
to authenticated
using (bucket_id = 'chat-media' and public.is_admin())
with check (bucket_id = 'chat-media' and public.is_admin());

alter table reviews drop constraint if exists reviews_comment_length;
alter table reviews add constraint reviews_comment_length check (length(comment) <= 1000);
