-- Commit 2: core tables + Row Level Security
-- Run this in the Supabase SQL editor (or `supabase db push` once linked).

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- questionnaire_responses
-- ---------------------------------------------------------------------------
create table if not exists public.questionnaire_responses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  answers jsonb not null,
  created_at timestamptz not null default now()
);

alter table public.questionnaire_responses enable row level security;

create policy "select own questionnaire_responses"
  on public.questionnaire_responses for select
  using (user_id = auth.uid());

create policy "insert own questionnaire_responses"
  on public.questionnaire_responses for insert
  with check (user_id = auth.uid());

create policy "update own questionnaire_responses"
  on public.questionnaire_responses for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- risk_results
-- ---------------------------------------------------------------------------
create table if not exists public.risk_results (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  questionnaire_id uuid not null references public.questionnaire_responses (id) on delete cascade,
  risk_level text not null check (risk_level in ('low', 'moderate', 'high')),
  explanation text not null,
  created_at timestamptz not null default now()
);

alter table public.risk_results enable row level security;

create policy "select own risk_results"
  on public.risk_results for select
  using (user_id = auth.uid());

create policy "insert own risk_results"
  on public.risk_results for insert
  with check (user_id = auth.uid());

create policy "update own risk_results"
  on public.risk_results for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- payment_routes
-- Reference data, not user-owned. Readable by any signed-in user; writes are
-- restricted to migrations/service role (no insert/update/delete policy for
-- anon/authenticated roles, so RLS blocks the app from mutating this table).
-- ---------------------------------------------------------------------------
create table if not exists public.payment_routes (
  id uuid primary key default gen_random_uuid(),
  label text not null unique,
  description text not null,
  type text not null check (
    type in ('installment_plan', 'imss_route', 'community_fund')
  ),
  is_simulated boolean not null default true,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.payment_routes enable row level security;

create policy "authenticated users can read payment_routes"
  on public.payment_routes for select
  to authenticated
  using (true);

-- ---------------------------------------------------------------------------
-- risk_result_routes (join table)
-- Access is derived from ownership of the parent risk_results row.
-- ---------------------------------------------------------------------------
create table if not exists public.risk_result_routes (
  id uuid primary key default gen_random_uuid(),
  risk_result_id uuid not null references public.risk_results (id) on delete cascade,
  payment_route_id uuid not null references public.payment_routes (id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.risk_result_routes enable row level security;

create policy "select own risk_result_routes"
  on public.risk_result_routes for select
  using (
    exists (
      select 1 from public.risk_results r
      where r.id = risk_result_routes.risk_result_id
        and r.user_id = auth.uid()
    )
  );

create policy "insert own risk_result_routes"
  on public.risk_result_routes for insert
  with check (
    exists (
      select 1 from public.risk_results r
      where r.id = risk_result_routes.risk_result_id
        and r.user_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------------
-- Seed data: invented, clearly simulated payment routes
-- ---------------------------------------------------------------------------
insert into public.payment_routes (label, description, type, is_simulated, is_active)
values
  (
    'Plan de pago simulado (3 pagos)',
    'Ejemplo simulado de cómo se vería dividir el costo de una consulta y estudios iniciales en 3 pagos quincenales. No es una oferta real de ninguna institución financiera.',
    'installment_plan',
    true,
    true
  ),
  (
    'Ruta simulada hacia IMSS-Bienestar',
    'Ejemplo simulado de los pasos para solicitar una cita de valoración en un módulo de IMSS-Bienestar cercano. No es una cita real ni una integración con el sistema del IMSS.',
    'imss_route',
    true,
    true
  ),
  (
    'Fondo comunitario simulado',
    'Ejemplo simulado de una caja de ahorro o tanda comunitaria que varios vecinos podrían usar para cubrir gastos médicos imprevistos. No es un fondo real ni gestiona dinero de verdad.',
    'community_fund',
    true,
    true
  ),
  (
    'Plan de pago simulado (6 pagos)',
    'Ejemplo simulado de un plan más largo, en 6 pagos mensuales, para tratamientos de mayor costo. No es una oferta real de ninguna institución financiera.',
    'installment_plan',
    true,
    true
  )
on conflict (label) do nothing;
