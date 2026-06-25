-- ───────────────────────────────────────────────────────────────────────────
-- Sunset Breeze — Supabase schema
-- Run this in: Supabase Dashboard → SQL Editor → New query → paste → Run.
-- Convention: every table & bucket is prefixed "SB_".
-- ───────────────────────────────────────────────────────────────────────────

-- Rental applications submitted from the public website.
create table if not exists public."SB_applications" (
  id                 uuid primary key default gen_random_uuid(),
  created_at         timestamptz not null default now(),
  status             text not null default 'new',   -- new | screening | approved | declined
  property_address   text,

  -- applicant
  full_name          text not null,
  dob_year           text,
  email              text not null,
  phone              text not null,

  -- move-in & household
  desired_move_in    text,
  lease_term_ok      text,
  total_occupants    text,
  adults             text,
  occupant_names     text,

  -- income & employment
  employment_status  text,
  monthly_income     text,
  employer           text,

  -- pets & vehicles
  pets               text,
  vehicles           text,
  vehicles_registered text,
  smoker             text,

  -- history
  current_address    text,
  landlord_contact   text,
  reason_moving      text,
  ever_evicted       text,
  bankruptcy         text,
  notes              text,

  -- consent flags
  consent_screening  text,
  certify_true       text
);

create index if not exists sb_applications_created_idx on public."SB_applications" (created_at desc);

-- Row Level Security: lock the table down. The website writes using the
-- service_role key (which bypasses RLS), so we do NOT add any public policies.
-- This means anon/auth users cannot read applicants' data from the browser.
alter table public."SB_applications" enable row level security;

-- ───────────────────────────────────────────────────────────────────────────
-- Storage bucket for listing photos (PUBLIC read).
-- Easiest path: create it in the Dashboard → Storage → New bucket
--   Name: SB_property_photos   |   Public bucket: ON
-- Or uncomment the line below to create it via SQL:
-- ───────────────────────────────────────────────────────────────────────────
-- insert into storage.buckets (id, name, public)
-- values ('SB_property_photos', 'SB_property_photos', true)
-- on conflict (id) do nothing;


-- ═══════════════════════════════════════════════════════════════════════════
-- PHASE 2 — Portal: profiles, leases, payments, expenses
-- All access happens server-side with the service_role key after we verify the
-- logged-in user + role. So RLS is ON with NO public policies (deny-all from
-- the browser) — the safest default. The browser never queries these directly.
-- ═══════════════════════════════════════════════════════════════════════════

-- One row per signed-up user. role = 'tenant' (default) or 'admin' (landlord).
create table if not exists public."SB_profiles" (
  id          uuid primary key references auth.users (id) on delete cascade,
  email       text,
  full_name   text,
  phone       text,
  role        text not null default 'tenant',
  created_at  timestamptz not null default now()
);
alter table public."SB_profiles" enable row level security;

-- A tenant's lease. Landlord creates/links it to the tenant's user id.
create table if not exists public."SB_leases" (
  id                     uuid primary key default gen_random_uuid(),
  tenant_id              uuid references auth.users (id) on delete set null,
  property_address       text not null default '8770 Sunset Breeze Dr., Reno, NV 89506',
  rent                   numeric not null default 2395,
  deposit                numeric default 2395,
  start_date             date,
  end_date               date,
  status                 text not null default 'active',  -- active | ended
  paypal_subscription_id text,
  created_at             timestamptz not null default now()
);
alter table public."SB_leases" enable row level security;
create index if not exists sb_leases_tenant_idx on public."SB_leases" (tenant_id);

-- Every rent payment (PayPal, check, or ACH). This is the ledger.
create table if not exists public."SB_payments" (
  id            uuid primary key default gen_random_uuid(),
  lease_id      uuid references public."SB_leases" (id) on delete set null,
  tenant_id     uuid references auth.users (id) on delete set null,
  amount        numeric not null,
  method        text not null default 'paypal',     -- paypal | check | ach | other
  status        text not null default 'completed',  -- completed | pending
  paid_for_month date,                              -- the month this covers (1st of month)
  external_id   text,                               -- PayPal transaction/sale id
  note          text,
  recorded_by   text default 'system',              -- webhook | admin | tenant
  created_at    timestamptz not null default now()
);
alter table public."SB_payments" enable row level security;
create unique index if not exists sb_payments_external_idx
  on public."SB_payments" (external_id) where external_id is not null;
create index if not exists sb_payments_tenant_idx on public."SB_payments" (tenant_id);

-- Landlord's deductible expenses, categorized to IRS Schedule E lines.
create table if not exists public."SB_expenses" (
  id            uuid primary key default gen_random_uuid(),
  expense_date  date not null,
  amount        numeric not null,
  category      text not null,        -- maps to a Schedule E line (see app/admin)
  vendor        text,
  vendor_is_individual boolean default false,  -- helps flag 1099-NEC ($600+ to a person)
  description   text,
  receipt_path  text,                 -- object path inside the SB_receipts bucket
  created_at    timestamptz not null default now()
);
alter table public."SB_expenses" enable row level security;
create index if not exists sb_expenses_date_idx on public."SB_expenses" (expense_date);

-- ── Private bucket for expense receipts ────────────────────────────────────
-- Easiest: Dashboard → Storage → New bucket → name "SB_receipts", Public OFF.
-- Or via SQL:
-- insert into storage.buckets (id, name, public)
-- values ('SB_receipts', 'SB_receipts', false)
-- on conflict (id) do nothing;


-- ── NV Energy (and other) utility bills forwarded to the tenant ─────────────
-- The electricity account stays in the owner's name (solar net metering), so
-- each NV Energy bill is (a) logged as a deductible Utilities expense AND
-- (b) forwarded to the tenant to pay. One import → both records.
create table if not exists public."SB_utility_bills" (
  id            uuid primary key default gen_random_uuid(),
  lease_id      uuid references public."SB_leases" (id) on delete set null,
  tenant_id     uuid references auth.users (id) on delete set null,
  provider      text not null default 'NV Energy',
  period        date,                               -- billing month (1st of month)
  amount        numeric not null,
  status        text not null default 'forwarded',  -- forwarded | paid
  pdf_path      text,                               -- bill PDF in SB_receipts
  expense_id    uuid references public."SB_expenses" (id) on delete set null,
  source        text default 'manual',              -- manual | import
  created_at    timestamptz not null default now()
);
alter table public."SB_utility_bills" enable row level security;
create index if not exists sb_utility_bills_tenant_idx on public."SB_utility_bills" (tenant_id);

