-- Local POS — Multi-tenant Supabase schema (Phase 8A)
-- Apply in Supabase SQL Editor (or `supabase db push` if using CLI).
-- Requires: Auth enabled. First super_admin is created manually after apply.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- SaaS core
-- ---------------------------------------------------------------------------

create table if not exists public.shops (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  owner_name text not null default '',
  owner_phone text not null default '',
  business_type text not null check (business_type in ('food', 'retail', 'bakery')),
  plan text not null default 'basic' check (plan in ('basic', 'pro')),
  status text not null default 'trial'
    check (status in ('trial', 'active', 'grace', 'suspended')),
  expires_at timestamptz not null,
  grace_days int not null default 7 check (grace_days >= 0),
  feature_flags jsonb not null default '{
    "enableKhata": true,
    "enableWhatsAppReport": true,
    "enableAuditLog": false,
    "enableSplitPayment": false,
    "enableInventory": true
  }'::jsonb,
  offline_secret text not null,
  last_sync_at timestamptz,
  -- Shop-editable profile (mirrors Dexie settings; billing columns protected by trigger)
  address text not null default '',
  logo_base64 text,
  receipt_config jsonb not null default '{
    "showLogo": true,
    "showToken": true,
    "showOrderType": true,
    "showTax": false,
    "showSku": false,
    "showUdhaarBalance": true,
    "showItemDiscount": true,
    "autoPrintKot": true,
    "taxPercent": 0,
    "footerMessage": "Thank you! Visit again"
  }'::jsonb,
  printer_width int not null default 80 check (printer_width in (58, 80)),
  currency text not null default 'PKR',
  language text not null default 'en' check (language in ('en', 'ur')),
  opening_cash_default numeric not null default 0,
  min_stock_alert int not null default 5,
  owner_whatsapp text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  shop_id uuid references public.shops (id) on delete set null,
  role text not null check (role in ('super_admin', 'shop_owner', 'cashier')),
  full_name text not null default '',
  phone text not null default '',
  created_at timestamptz not null default now(),
  constraint profiles_super_admin_shop_null check (
    (role = 'super_admin' and shop_id is null)
    or (role <> 'super_admin' and shop_id is not null)
  )
);

create index if not exists profiles_shop_id_idx on public.profiles (shop_id);
create index if not exists shops_status_expires_idx on public.shops (status, expires_at);

create table if not exists public.subscription_payments (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops (id) on delete cascade,
  amount numeric not null check (amount >= 0),
  method text not null check (method in ('cash', 'easypaisa', 'jazzcash', 'bank')),
  days_added int not null check (days_added >= 0),
  note text not null default '',
  recorded_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists subscription_payments_shop_id_idx
  on public.subscription_payments (shop_id, created_at desc);

-- ---------------------------------------------------------------------------
-- Operational mirrors (Dexie entities + shop_id + soft delete)
-- ---------------------------------------------------------------------------

create table if not exists public.categories (
  id uuid primary key,
  shop_id uuid not null references public.shops (id) on delete cascade,
  name text not null,
  color text not null default '#334155',
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists public.products (
  id uuid primary key,
  shop_id uuid not null references public.shops (id) on delete cascade,
  category_id uuid not null,
  name text not null,
  price numeric not null default 0,
  cost_price numeric not null default 0,
  sku text not null default '',
  stock numeric,
  track_stock boolean not null default false,
  unit text not null default 'pcs',
  allow_fractional boolean not null default false,
  weight_presets jsonb not null default '[]'::jsonb,
  image_base64 text,
  color text not null default '#334155',
  variants jsonb not null default '[]'::jsonb,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists public.orders (
  id uuid primary key,
  shop_id uuid not null references public.shops (id) on delete cascade,
  invoice_number text not null,
  token_number int,
  order_type text,
  items jsonb not null default '[]'::jsonb,
  subtotal numeric not null default 0,
  discount numeric not null default 0,
  tax numeric not null default 0,
  total numeric not null default 0,
  payment_method text not null default 'cash',
  payment_breakdown jsonb not null default '{"cash":0,"online":0,"udhaar":0}'::jsonb,
  cash_received numeric,
  change_returned numeric,
  customer_id uuid,
  customer_name text,
  previous_balance numeric,
  new_balance numeric,
  status text not null default 'completed',
  note text not null default '',
  local_date date not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists public.expenses (
  id uuid primary key,
  shop_id uuid not null references public.shops (id) on delete cascade,
  title text not null,
  category text not null default 'Misc',
  amount numeric not null default 0,
  payment_method text not null default 'cash',
  note text not null default '',
  local_date date not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists public.customers (
  id uuid primary key,
  shop_id uuid not null references public.shops (id) on delete cascade,
  name text not null,
  phone text not null default '',
  balance numeric not null default 0,
  note text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists public.khata_transactions (
  id uuid primary key,
  shop_id uuid not null references public.shops (id) on delete cascade,
  customer_id uuid not null,
  order_id uuid,
  type text not null check (type in ('debit', 'credit')),
  amount numeric not null default 0,
  note text not null default '',
  local_date date not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists public.day_closings (
  id uuid primary key,
  shop_id uuid not null references public.shops (id) on delete cascade,
  date date not null,
  opening_cash numeric not null default 0,
  total_sales numeric not null default 0,
  cash_sales numeric not null default 0,
  online_sales numeric not null default 0,
  udhaar_sales numeric not null default 0,
  total_expenses numeric not null default 0,
  khata_cash_received numeric not null default 0,
  expected_cash numeric not null default 0,
  actual_cash numeric,
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists public.audit_logs (
  id uuid primary key,
  shop_id uuid not null references public.shops (id) on delete cascade,
  action text not null,
  details text not null default '',
  performed_by text not null default 'owner',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

-- Hot-path indexes
create index if not exists categories_shop_updated_idx
  on public.categories (shop_id, updated_at desc);
create index if not exists products_shop_updated_idx
  on public.products (shop_id, updated_at desc);
create index if not exists products_shop_active_idx
  on public.products (shop_id, is_active) where deleted_at is null;
create index if not exists orders_shop_updated_idx
  on public.orders (shop_id, updated_at desc);
create index if not exists orders_shop_local_date_idx
  on public.orders (shop_id, local_date);
create index if not exists expenses_shop_local_date_idx
  on public.expenses (shop_id, local_date);
create index if not exists customers_shop_updated_idx
  on public.customers (shop_id, updated_at desc);
create index if not exists khata_shop_customer_idx
  on public.khata_transactions (shop_id, customer_id);
create index if not exists khata_shop_local_date_idx
  on public.khata_transactions (shop_id, local_date);
create index if not exists day_closings_shop_date_idx
  on public.day_closings (shop_id, date);
create index if not exists audit_logs_shop_created_idx
  on public.audit_logs (shop_id, created_at desc);

-- ---------------------------------------------------------------------------
-- RLS helpers (SECURITY DEFINER — no recursive policy lookups)
-- ---------------------------------------------------------------------------

create or replace function public.get_my_shop_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select shop_id from public.profiles where id = auth.uid() limit 1;
$$;

create or replace function public.is_super_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'super_admin'
  );
$$;

create or replace function public.get_my_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid() limit 1;
$$;

create or replace function public.get_server_time()
returns timestamptz
language sql
stable
security definer
set search_path = public
as $$
  select now();
$$;

grant execute on function public.get_my_shop_id() to authenticated;
grant execute on function public.is_super_admin() to authenticated;
grant execute on function public.get_my_role() to authenticated;
grant execute on function public.get_server_time() to authenticated;

-- ---------------------------------------------------------------------------
-- Billing / privilege protection triggers
-- ---------------------------------------------------------------------------

create or replace function public.protect_shop_billing_columns()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.is_super_admin() then
    return new;
  end if;

  if new.plan is distinct from old.plan
     or new.status is distinct from old.status
     or new.expires_at is distinct from old.expires_at
     or new.grace_days is distinct from old.grace_days
     or new.feature_flags is distinct from old.feature_flags
     or new.offline_secret is distinct from old.offline_secret
  then
    raise exception 'Shop users cannot modify billing or license fields';
  end if;

  return new;
end;
$$;

drop trigger if exists shops_protect_billing on public.shops;
create trigger shops_protect_billing
  before update on public.shops
  for each row
  execute function public.protect_shop_billing_columns();

create or replace function public.protect_profile_escalation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.is_super_admin() then
    return new;
  end if;

  if tg_op = 'UPDATE' then
    if new.role is distinct from old.role
       or new.shop_id is distinct from old.shop_id
    then
      raise exception 'Cannot change role or shop_id';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists profiles_protect_escalation on public.profiles;
create trigger profiles_protect_escalation
  before update on public.profiles
  for each row
  execute function public.protect_profile_escalation();

-- ---------------------------------------------------------------------------
-- Enable RLS
-- ---------------------------------------------------------------------------

alter table public.shops enable row level security;
alter table public.profiles enable row level security;
alter table public.subscription_payments enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.orders enable row level security;
alter table public.expenses enable row level security;
alter table public.customers enable row level security;
alter table public.khata_transactions enable row level security;
alter table public.day_closings enable row level security;
alter table public.audit_logs enable row level security;

-- ---------------------------------------------------------------------------
-- shops policies
-- ---------------------------------------------------------------------------

drop policy if exists shops_select on public.shops;
create policy shops_select on public.shops
  for select to authenticated
  using (
    public.is_super_admin()
    or id = public.get_my_shop_id()
  );

drop policy if exists shops_insert on public.shops;
create policy shops_insert on public.shops
  for insert to authenticated
  with check (public.is_super_admin());

drop policy if exists shops_update on public.shops;
create policy shops_update on public.shops
  for update to authenticated
  using (
    public.is_super_admin()
    or id = public.get_my_shop_id()
  )
  with check (
    public.is_super_admin()
    or id = public.get_my_shop_id()
  );

drop policy if exists shops_delete on public.shops;
create policy shops_delete on public.shops
  for delete to authenticated
  using (public.is_super_admin());

-- ---------------------------------------------------------------------------
-- profiles policies
-- ---------------------------------------------------------------------------

drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles
  for select to authenticated
  using (
    public.is_super_admin()
    or id = auth.uid()
    or (
      -- shop_owner may list cashiers in the same shop (no recursive profiles scan)
      public.get_my_role() = 'shop_owner'
      and shop_id is not null
      and shop_id = public.get_my_shop_id()
    )
  );

drop policy if exists profiles_insert on public.profiles;
create policy profiles_insert on public.profiles
  for insert to authenticated
  with check (public.is_super_admin());

drop policy if exists profiles_update on public.profiles;
create policy profiles_update on public.profiles
  for update to authenticated
  using (
    public.is_super_admin()
    or id = auth.uid()
  )
  with check (
    public.is_super_admin()
    or id = auth.uid()
  );

drop policy if exists profiles_delete on public.profiles;
create policy profiles_delete on public.profiles
  for delete to authenticated
  using (public.is_super_admin());

-- ---------------------------------------------------------------------------
-- subscription_payments policies
-- ---------------------------------------------------------------------------

drop policy if exists subscription_payments_select on public.subscription_payments;
create policy subscription_payments_select on public.subscription_payments
  for select to authenticated
  using (
    public.is_super_admin()
    or shop_id = public.get_my_shop_id()
  );

drop policy if exists subscription_payments_insert on public.subscription_payments;
create policy subscription_payments_insert on public.subscription_payments
  for insert to authenticated
  with check (public.is_super_admin());

drop policy if exists subscription_payments_update on public.subscription_payments;
create policy subscription_payments_update on public.subscription_payments
  for update to authenticated
  using (public.is_super_admin())
  with check (public.is_super_admin());

drop policy if exists subscription_payments_delete on public.subscription_payments;
create policy subscription_payments_delete on public.subscription_payments
  for delete to authenticated
  using (public.is_super_admin());

-- ---------------------------------------------------------------------------
-- Operational table policies (tenant isolation)
-- ---------------------------------------------------------------------------

-- categories
drop policy if exists categories_all on public.categories;
create policy categories_all on public.categories
  for all to authenticated
  using (public.is_super_admin() or shop_id = public.get_my_shop_id())
  with check (public.is_super_admin() or shop_id = public.get_my_shop_id());

-- products
drop policy if exists products_all on public.products;
create policy products_all on public.products
  for all to authenticated
  using (public.is_super_admin() or shop_id = public.get_my_shop_id())
  with check (public.is_super_admin() or shop_id = public.get_my_shop_id());

-- orders
drop policy if exists orders_all on public.orders;
create policy orders_all on public.orders
  for all to authenticated
  using (public.is_super_admin() or shop_id = public.get_my_shop_id())
  with check (public.is_super_admin() or shop_id = public.get_my_shop_id());

-- expenses
drop policy if exists expenses_all on public.expenses;
create policy expenses_all on public.expenses
  for all to authenticated
  using (public.is_super_admin() or shop_id = public.get_my_shop_id())
  with check (public.is_super_admin() or shop_id = public.get_my_shop_id());

-- customers
drop policy if exists customers_all on public.customers;
create policy customers_all on public.customers
  for all to authenticated
  using (public.is_super_admin() or shop_id = public.get_my_shop_id())
  with check (public.is_super_admin() or shop_id = public.get_my_shop_id());

-- khata_transactions
drop policy if exists khata_transactions_all on public.khata_transactions;
create policy khata_transactions_all on public.khata_transactions
  for all to authenticated
  using (public.is_super_admin() or shop_id = public.get_my_shop_id())
  with check (public.is_super_admin() or shop_id = public.get_my_shop_id());

-- day_closings
drop policy if exists day_closings_all on public.day_closings;
create policy day_closings_all on public.day_closings
  for all to authenticated
  using (public.is_super_admin() or shop_id = public.get_my_shop_id())
  with check (public.is_super_admin() or shop_id = public.get_my_shop_id());

-- audit_logs
drop policy if exists audit_logs_all on public.audit_logs;
create policy audit_logs_all on public.audit_logs
  for all to authenticated
  using (public.is_super_admin() or shop_id = public.get_my_shop_id())
  with check (public.is_super_admin() or shop_id = public.get_my_shop_id());

-- ---------------------------------------------------------------------------
-- Realtime (Super Admin live counts / directory)
-- Safe to re-run: ignores "already member of publication".
-- ---------------------------------------------------------------------------

do $$
begin
  begin
    alter publication supabase_realtime add table public.shops;
  exception when duplicate_object then null;
  end;
  begin
    alter publication supabase_realtime add table public.subscription_payments;
  exception when duplicate_object then null;
  end;
end $$;

-- ---------------------------------------------------------------------------
-- Bootstrap note (manual, once):
-- 1) Create an Auth user in Supabase Dashboard (email/password).
-- 2) Insert profile:
--    insert into public.profiles (id, shop_id, role, full_name, phone)
--    values ('<auth-user-uuid>', null, 'super_admin', 'Platform Admin', '');
-- ---------------------------------------------------------------------------

