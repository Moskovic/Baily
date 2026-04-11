-- Quito: initial schema
-- Run in Supabase SQL editor, or via `supabase db push` if you use the CLI.

-- =========
-- profiles
-- =========
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  company_name text,
  address text,
  gmail_refresh_token text, -- encrypt later with pgsodium / vault
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles: self read"
  on public.profiles for select
  using (auth.uid() = id);

create policy "profiles: self upsert"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "profiles: self update"
  on public.profiles for update
  using (auth.uid() = id);

-- Auto-create a profile when a user signs up
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Shared updated_at trigger
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ============
-- properties
-- ============
create table public.properties (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  label text not null,
  address text not null,
  city text not null,
  postal_code text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index properties_owner_idx on public.properties(owner_id);

alter table public.properties enable row level security;

create policy "properties: owner all"
  on public.properties for all
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

create trigger properties_updated_at before update on public.properties
  for each row execute procedure public.set_updated_at();

-- =========
-- tenants
-- =========
create table public.tenants (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  full_name text not null,
  email text not null,
  phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index tenants_owner_idx on public.tenants(owner_id);

alter table public.tenants enable row level security;

create policy "tenants: owner all"
  on public.tenants for all
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

create trigger tenants_updated_at before update on public.tenants
  for each row execute procedure public.set_updated_at();

-- ========
-- leases
-- ========
create table public.leases (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  property_id uuid not null references public.properties(id) on delete cascade,
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  rent_amount numeric(10,2) not null check (rent_amount >= 0),
  charges_amount numeric(10,2) not null default 0 check (charges_amount >= 0),
  payment_day smallint not null default 1 check (payment_day between 1 and 31),
  start_date date not null,
  end_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index leases_owner_idx on public.leases(owner_id);
create index leases_property_idx on public.leases(property_id);
create index leases_tenant_idx on public.leases(tenant_id);

alter table public.leases enable row level security;

create policy "leases: owner all"
  on public.leases for all
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

create trigger leases_updated_at before update on public.leases
  for each row execute procedure public.set_updated_at();

-- ==========
-- receipts
-- ==========
create type public.receipt_status as enum ('draft', 'sent', 'paid');

create table public.receipts (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  lease_id uuid not null references public.leases(id) on delete cascade,
  period_month smallint not null check (period_month between 1 and 12),
  period_year smallint not null check (period_year between 2000 and 2100),
  rent_amount numeric(10,2) not null,
  charges_amount numeric(10,2) not null default 0,
  payment_date date not null,
  status public.receipt_status not null default 'draft',
  sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (lease_id, period_year, period_month)
);

create index receipts_owner_idx on public.receipts(owner_id);
create index receipts_lease_idx on public.receipts(lease_id);

alter table public.receipts enable row level security;

create policy "receipts: owner all"
  on public.receipts for all
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

create trigger receipts_updated_at before update on public.receipts
  for each row execute procedure public.set_updated_at();
