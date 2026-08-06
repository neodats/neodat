-- ============================================================
-- NEODAT · ANALÍTICA, CONTACTOS E INGRESOS
-- Ejecutar completo en Supabase > SQL Editor.
-- ============================================================

create extension if not exists pgcrypto;

create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  created_at timestamptz not null default now()
);

create table if not exists public.analytics_events (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  event_type text not null check (char_length(event_type) between 1 and 80),
  page_path text,
  page_title text,
  referrer text,
  visitor_id text not null,
  session_id text not null,
  device_type text,
  browser text,
  language text,
  screen_width integer,
  is_conversion boolean not null default false,
  metadata jsonb not null default '{}'::jsonb
);

create table if not exists public.contact_leads (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  name text not null,
  company text,
  email text not null,
  phone text,
  city text,
  priority text not null default 'Consulta general',
  services text[] not null default '{}',
  message text not null,
  page_path text,
  visitor_id text,
  status text not null default 'Nuevo' check (status in ('Nuevo', 'Contactado', 'En proceso', 'Cerrado', 'Descartado')),
  notes text
);

create table if not exists public.financial_transactions (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  transaction_date date not null default current_date,
  transaction_type text not null check (transaction_type in ('Ingreso', 'Gasto')),
  category text not null,
  description text,
  amount numeric(14,2) not null check (amount >= 0),
  source text,
  created_by uuid references auth.users(id) on delete set null
);

create index if not exists analytics_events_created_at_idx on public.analytics_events(created_at desc);
create index if not exists analytics_events_type_idx on public.analytics_events(event_type);
create index if not exists analytics_events_visitor_idx on public.analytics_events(visitor_id);
create index if not exists analytics_events_page_idx on public.analytics_events(page_path);
create index if not exists contact_leads_created_at_idx on public.contact_leads(created_at desc);
create index if not exists contact_leads_status_idx on public.contact_leads(status);
create index if not exists financial_transactions_date_idx on public.financial_transactions(transaction_date desc);

alter table public.admin_users enable row level security;
alter table public.analytics_events enable row level security;
alter table public.contact_leads enable row level security;
alter table public.financial_transactions enable row level security;

create or replace function public.is_neodat_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.admin_users
    where user_id = auth.uid()
  );
$$;

revoke all on function public.is_neodat_admin() from public;
grant execute on function public.is_neodat_admin() to authenticated;

-- El usuario autenticado puede comprobar si su propia cuenta es administradora.
drop policy if exists "admin_users_read_own" on public.admin_users;
create policy "admin_users_read_own"
on public.admin_users
for select
to authenticated
using (user_id = auth.uid());

-- El sitio público únicamente puede insertar métricas.
drop policy if exists "analytics_public_insert" on public.analytics_events;
create policy "analytics_public_insert"
on public.analytics_events
for insert
to anon, authenticated
with check (
  event_type in (
    'page_view', 'whatsapp_click', 'email_click', 'phone_click',
    'meeting_click', 'contact_form', 'simulator_click'
  )
  and char_length(visitor_id) between 10 and 120
  and char_length(session_id) between 10 and 120
);

-- Solo administradores pueden consultar o depurar métricas.
drop policy if exists "analytics_admin_select" on public.analytics_events;
create policy "analytics_admin_select"
on public.analytics_events
for select
to authenticated
using (public.is_neodat_admin());

drop policy if exists "analytics_admin_delete" on public.analytics_events;
create policy "analytics_admin_delete"
on public.analytics_events
for delete
to authenticated
using (public.is_neodat_admin());

-- El formulario público puede registrar solicitudes, pero no leerlas.
drop policy if exists "leads_public_insert" on public.contact_leads;
create policy "leads_public_insert"
on public.contact_leads
for insert
to anon, authenticated
with check (
  char_length(name) between 2 and 180
  and char_length(email) between 5 and 250
  and char_length(message) between 2 and 4000
  and status = 'Nuevo'
);

drop policy if exists "leads_admin_select" on public.contact_leads;
create policy "leads_admin_select"
on public.contact_leads
for select
to authenticated
using (public.is_neodat_admin());

drop policy if exists "leads_admin_update" on public.contact_leads;
create policy "leads_admin_update"
on public.contact_leads
for update
to authenticated
using (public.is_neodat_admin())
with check (public.is_neodat_admin());

drop policy if exists "leads_admin_delete" on public.contact_leads;
create policy "leads_admin_delete"
on public.contact_leads
for delete
to authenticated
using (public.is_neodat_admin());

-- Los movimientos financieros son completamente privados.
drop policy if exists "transactions_admin_all" on public.financial_transactions;
create policy "transactions_admin_all"
on public.financial_transactions
for all
to authenticated
using (public.is_neodat_admin())
with check (public.is_neodat_admin());

-- Permisos de tabla necesarios; RLS mantiene la restricción efectiva.
grant insert on public.analytics_events to anon, authenticated;
grant insert on public.contact_leads to anon, authenticated;
grant select, delete on public.analytics_events to authenticated;
grant select, update, delete on public.contact_leads to authenticated;
grant select, insert, update, delete on public.financial_transactions to authenticated;
grant select on public.admin_users to authenticated;

-- ============================================================
-- DESPUÉS DE CREAR EL USUARIO EN AUTHENTICATION > USERS,
-- reemplace el UUID y ejecute esta sentencia por separado:
--
-- insert into public.admin_users (user_id, display_name)
-- values ('UUID-DEL-USUARIO', 'Administrador NeoDat');
-- ============================================================
