-- Crear tablas base
create table if not exists public.households (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz default now()
);

create table if not exists public.user_profiles (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid not null references auth.users(id) on delete cascade,
  household_id uuid not null references public.households(id) on delete cascade,
  display_name text,
  created_at timestamptz default now(),
  unique(auth_user_id)
);

create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  date date not null,
  category text not null,
  tipo text not null check (tipo in ('ingreso', 'gasto')),
  monto numeric(12,2) not null,
  persona text not null,
  metodo text,
  nota text,
  created_at timestamptz default now()
);

create table if not exists public.budgets (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  month_key text not null,
  category text not null,
  amount numeric(12,2) not null,
  created_at timestamptz default now(),
  unique (household_id, month_key, category)
);

create table if not exists public.debts (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  entity text not null,
  balance numeric(12,2) not null,
  monthly_payment numeric(12,2) not null,
  status text not null default 'activa' check (status in ('activa', 'pagada', 'morosa')),
  created_at timestamptz default now()
);

create table if not exists public.savings (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  goal_name text not null,
  target_amount numeric(12,2) not null,
  current_amount numeric(12,2) default 0,
  deadline date,
  created_at timestamptz default now()
);