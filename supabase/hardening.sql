-- Apply after neodat-schema.sql. Re-runnable; existing leads are preserved.
begin;
alter table public.contact_leads add column if not exists request_id uuid;
create unique index if not exists contact_leads_request_id_key on public.contact_leads(request_id);

-- All public lead submissions must pass through the CAPTCHA-protected function.
drop policy if exists leads_public_insert on public.contact_leads;
revoke insert on public.contact_leads from anon, authenticated;
grant select, insert, update on public.contact_leads to service_role;

-- Use a private schema for atomic, short-lived rate counters.
create schema if not exists neodat_private;
revoke all on schema neodat_private from public, anon, authenticated;
create table if not exists neodat_private.contact_rate_limits (
  bucket text not null,
  window_start timestamptz not null,
  requests integer not null default 1,
  primary key (bucket, window_start)
);
create index if not exists contact_rate_expiry_idx on neodat_private.contact_rate_limits(window_start);
alter table neodat_private.contact_rate_limits enable row level security;
create or replace function public.claim_contact_slot(p_bucket text)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  slot timestamptz := to_timestamp(floor(extract(epoch from now()) / 600) * 600);
  request_count integer;
begin
  if p_bucket is null or p_bucket !~ '^[0-9a-f]{64}$' then return false; end if;
  delete from neodat_private.contact_rate_limits where window_start < now() - interval '1 day';
  insert into neodat_private.contact_rate_limits(bucket, window_start, requests)
  values (p_bucket, slot, 1)
  on conflict (bucket, window_start) do update
  set requests = least(neodat_private.contact_rate_limits.requests + 1, 6)
  returning requests into request_count;
  return request_count <= 5;
end;
$$;
revoke all on function public.claim_contact_slot(text) from public, anon, authenticated;
grant execute on function public.claim_contact_slot(text) to service_role;

-- The role lookup is isolated from the API schema and has a fixed search path.
create or replace function neodat_private.is_admin()
returns boolean language sql stable security definer set search_path = ''
as $$ select exists (select 1 from public.admin_users where user_id = (select auth.uid())); $$;
revoke all on function neodat_private.is_admin() from public;
grant usage on schema neodat_private to authenticated;
grant execute on function neodat_private.is_admin() to authenticated;
-- Private tables remain inaccessible to browser roles even with schema usage.
revoke all on neodat_private.contact_rate_limits from public, anon, authenticated;

alter policy analytics_admin_select on public.analytics_events using ((select neodat_private.is_admin()));
alter policy analytics_admin_delete on public.analytics_events using ((select neodat_private.is_admin()));
alter policy leads_admin_select on public.contact_leads using ((select neodat_private.is_admin()));
alter policy leads_admin_update on public.contact_leads using ((select neodat_private.is_admin())) with check ((select neodat_private.is_admin()));
alter policy leads_admin_delete on public.contact_leads using ((select neodat_private.is_admin()));
alter policy transactions_admin_all on public.financial_transactions using ((select neodat_private.is_admin())) with check ((select neodat_private.is_admin()));
drop function if exists public.is_neodat_admin();

drop policy if exists analytics_public_insert on public.analytics_events;
create policy analytics_public_insert on public.analytics_events for insert to anon, authenticated
with check (
  event_type in ('page_view','page_engagement','whatsapp_click','email_click','phone_click','meeting_click','contact_form','simulator_click','outbound_click')
  and char_length(visitor_id) between 10 and 120
  and char_length(session_id) between 10 and 120
  and coalesce(char_length(page_path),0) <= 500
  and coalesce(char_length(page_title),0) <= 250
  and coalesce(char_length(referrer),0) <= 1000
  and coalesce(char_length(browser),0) <= 80
  and coalesce(char_length(language),0) <= 40
  and device_type in ('Móvil','Tablet','Escritorio')
  and screen_width between 0 and 20000
  and jsonb_typeof(metadata) = 'object' and octet_length(metadata::text) <= 8192
  and is_conversion = (event_type in ('contact_form','whatsapp_click','email_click','phone_click'))
  and created_at between now() - interval '5 minutes' and now() + interval '1 minute'
);
commit;
