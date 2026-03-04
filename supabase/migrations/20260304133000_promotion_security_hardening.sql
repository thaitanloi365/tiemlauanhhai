revoke all on function public.try_consume_promotion(uuid, timestamptz) from public;
revoke all on function public.release_promotion_usage(uuid, timestamptz) from public;
revoke execute on function public.try_consume_promotion(uuid, timestamptz) from anon;
revoke execute on function public.release_promotion_usage(uuid, timestamptz) from anon;
grant execute on function public.try_consume_promotion(uuid, timestamptz) to authenticated;
grant execute on function public.release_promotion_usage(uuid, timestamptz) to authenticated;

create table if not exists promotion_security_logs (
	id uuid primary key default gen_random_uuid(),
	event_type text not null,
	promotion_code text,
	ip_address text,
	reason text,
	metadata jsonb not null default '{}'::jsonb,
	created_at timestamptz not null default now()
);

create index if not exists idx_promotion_security_logs_event_type
on promotion_security_logs(event_type);

create index if not exists idx_promotion_security_logs_created_at
on promotion_security_logs(created_at);

create or replace function public.rollback_promotion_consume(
	p_promotion_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
	update promotions
	set used_count = greatest(used_count - 1, 0)
	where id = p_promotion_id;
end;
$$;

revoke all on function public.rollback_promotion_consume(uuid) from public;
revoke execute on function public.rollback_promotion_consume(uuid) from anon;
grant execute on function public.rollback_promotion_consume(uuid) to authenticated;

alter table promotion_security_logs enable row level security;

drop policy if exists "Admin can read promotion security logs" on promotion_security_logs;
create policy "Admin can read promotion security logs"
on promotion_security_logs
for select
to authenticated
using (public.is_admin());
