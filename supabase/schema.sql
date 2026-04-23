-- easyBILL clean-slate relational schema
-- Run in Supabase SQL editor on a fresh project.

create extension if not exists pgcrypto;

create or replace function public.touch_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create or replace function public.normalize_reset_month_day(value text)
returns text
language plpgsql
immutable
as $$
declare
  normalized text;
  month_part int;
  day_part int;
begin
  normalized := coalesce(trim(value), '01-01');
  if normalized !~ '^\d{2}-\d{2}$' then
    return '01-01';
  end if;

  month_part := split_part(normalized, '-', 1)::int;
  day_part := split_part(normalized, '-', 2)::int;

  if month_part < 1 or month_part > 12 then
    return '01-01';
  end if;

  if day_part <> 1 then
    return '01-01';
  end if;

  return lpad(month_part::text, 2, '0') || '-01';
end;
$$;

create or replace function public.compute_invoice_scope(reference_date date, reset_yearly boolean, reset_month_day text)
returns table(
  numbering_mode text,
  scope_key text,
  window_start date,
  window_end date
)
language plpgsql
immutable
as $$
declare
  normalized_reset text := public.normalize_reset_month_day(reset_month_day);
  reset_month int := split_part(normalized_reset, '-', 1)::int;
  reset_day int := split_part(normalized_reset, '-', 2)::int;
  reset_point_this_year date;
  start_year int;
begin
  if not reset_yearly then
    return query
    select
      'continuous'::text,
      'continuous'::text,
      null::date,
      null::date;
    return;
  end if;

  reset_point_this_year := make_date(extract(year from reference_date)::int, reset_month, reset_day);
  start_year := case when reference_date >= reset_point_this_year then extract(year from reference_date)::int else extract(year from reference_date)::int - 1 end;

  return query
  select
    'financial-year-reset'::text,
    'financial-year-reset:' || make_date(start_year, reset_month, reset_day)::text || ':' || normalized_reset,
    make_date(start_year, reset_month, reset_day),
    make_date(start_year + 1, reset_month, reset_day);
end;
$$;

create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  business_name text not null default '',
  phone text not null default '',
  email text not null default '',
  gst text not null default '',
  address text not null default '',
  bank_name text not null default '',
  account_number text not null default '',
  ifsc text not null default '',
  upi text not null default '',
  terms text not null default '',
  logo_storage_path text,
  logo_shape text not null default 'square' check (logo_shape in ('square', 'round')),
  onboarding_completed boolean not null default false,
  email_change_audit_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists profiles_touch on public.profiles;
create trigger profiles_touch before update on public.profiles for each row execute function public.touch_updated_at();

create table if not exists public.user_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  date_format text not null default 'YYYY-MM-DD',
  amount_format text not null default 'indian',
  show_decimals boolean not null default true,
  invoice_prefix text not null default 'INV-',
  invoice_padding integer not null default 4,
  invoice_start_number bigint not null default 1,
  reset_yearly boolean not null default true,
  invoice_reset_month_day text not null default '01-01',
  currency_symbol text not null default '₹',
  currency_position text not null default 'before' check (currency_position in ('before', 'after')),
  invoice_visibility jsonb not null default '{}'::jsonb,
  invoice_template text not null default '',
  template_typography text not null default '',
  template_font_id text not null default '',
  template_font_size integer not null default 10,
  subscription_plan_id text not null default 'free',
  invoice_usage_count integer not null default 0,
  invoice_usage_initialized boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists user_settings_touch on public.user_settings;
create trigger user_settings_touch before update on public.user_settings for each row execute function public.touch_updated_at();

create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  identity_key text not null default '',
  name text not null default '',
  phone text not null default '',
  email text not null default '',
  gst text not null default '',
  address text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists customers_user_id_idx on public.customers(user_id);
create index if not exists customers_identity_key_idx on public.customers(user_id, identity_key);
drop trigger if exists customers_touch on public.customers;
create trigger customers_touch before update on public.customers for each row execute function public.touch_updated_at();

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null default '',
  hsn text not null default '',
  unit text not null default '',
  price numeric(14,2) not null default 0,
  cgst numeric(8,2) not null default 0,
  sgst numeric(8,2) not null default 0,
  igst numeric(8,2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists products_user_id_idx on public.products(user_id);
drop trigger if exists products_touch on public.products;
create trigger products_touch before update on public.products for each row execute function public.touch_updated_at();

create table if not exists public.invoice_sequences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  scope_key text not null,
  numbering_mode text not null check (numbering_mode in ('continuous', 'financial-year-reset')),
  scope_start date,
  scope_end date,
  reset_month_day text,
  last_value bigint not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, scope_key)
);

create index if not exists invoice_sequences_user_id_idx on public.invoice_sequences(user_id);
drop trigger if exists invoice_sequences_touch on public.invoice_sequences;
create trigger invoice_sequences_touch before update on public.invoice_sequences for each row execute function public.touch_updated_at();

create table if not exists public.invoices (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  invoice_number text not null,
  created_at timestamptz not null default now(),
  invoice_date date not null,
  numbering_mode_at_creation text not null check (numbering_mode_at_creation in ('continuous', 'financial-year-reset')),
  reset_month_day_at_creation text,
  sequence_window_start date,
  sequence_window_end date,
  client_name text not null default '',
  client_phone text not null default '',
  client_email text not null default '',
  client_gst text not null default '',
  client_address text not null default '',
  custom_details jsonb not null default '[]'::jsonb,
  notes text not null default '',
  status text not null default 'draft' check (status in ('draft', 'issued', 'paid')),
  grand_total numeric(14,2) not null default 0,
  updated_at timestamptz not null default now(),
  unique (user_id, invoice_number)
);

create index if not exists invoices_user_id_idx on public.invoices(user_id);
create index if not exists invoices_user_date_idx on public.invoices(user_id, invoice_date desc, created_at desc);
drop trigger if exists invoices_touch on public.invoices;
create trigger invoices_touch before update on public.invoices for each row execute function public.touch_updated_at();

create table if not exists public.invoice_items (
  id uuid primary key default gen_random_uuid(),
  invoice_id text not null references public.invoices(id) on delete cascade,
  position integer not null default 0,
  product text not null default '',
  hsn text not null default '',
  qty numeric(14,3) not null default 0,
  unit text not null default '',
  price numeric(14,2) not null default 0,
  cgst numeric(8,2) not null default 0,
  sgst numeric(8,2) not null default 0,
  igst numeric(8,2) not null default 0,
  total numeric(14,2) not null default 0
);

create index if not exists invoice_items_invoice_id_idx on public.invoice_items(invoice_id, position);

create table if not exists public.invoice_history (
  id text primary key,
  invoice_id text not null references public.invoices(id) on delete cascade,
  event_type text not null check (event_type in ('created', 'edited', 'exported', 'status', 'duplicated')),
  label text not null,
  happened_at timestamptz not null default now()
);

create index if not exists invoice_history_invoice_id_idx on public.invoice_history(invoice_id, happened_at asc);

create table if not exists public.invoice_pdf_exports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  invoice_id text not null references public.invoices(id) on delete cascade,
  invoice_number text not null,
  source_fingerprint text not null,
  storage_path text not null,
  generated_at timestamptz not null default now(),
  last_accessed_at timestamptz,
  created_at timestamptz not null default now(),
  unique (user_id, invoice_id, source_fingerprint)
);

create index if not exists invoice_pdf_exports_user_invoice_created_idx on public.invoice_pdf_exports (user_id, invoice_id, created_at desc);
create index if not exists invoice_pdf_exports_user_created_idx on public.invoice_pdf_exports (user_id, created_at desc);
create index if not exists invoice_pdf_exports_purge_idx on public.invoice_pdf_exports (created_at);

alter table public.profiles enable row level security;
alter table public.user_settings enable row level security;
alter table public.customers enable row level security;
alter table public.products enable row level security;
alter table public.invoice_sequences enable row level security;
alter table public.invoices enable row level security;
alter table public.invoice_items enable row level security;
alter table public.invoice_history enable row level security;
alter table public.invoice_pdf_exports enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles for select using (auth.uid() = user_id);
drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles for insert with check (auth.uid() = user_id);
drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "user_settings_select_own" on public.user_settings;
create policy "user_settings_select_own" on public.user_settings for select using (auth.uid() = user_id);
drop policy if exists "user_settings_insert_own" on public.user_settings;
create policy "user_settings_insert_own" on public.user_settings for insert with check (auth.uid() = user_id);
drop policy if exists "user_settings_update_own" on public.user_settings;
create policy "user_settings_update_own" on public.user_settings for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "customers_select_own" on public.customers;
create policy "customers_select_own" on public.customers for select using (auth.uid() = user_id);
drop policy if exists "customers_insert_own" on public.customers;
create policy "customers_insert_own" on public.customers for insert with check (auth.uid() = user_id);
drop policy if exists "customers_update_own" on public.customers;
create policy "customers_update_own" on public.customers for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "customers_delete_own" on public.customers;
create policy "customers_delete_own" on public.customers for delete using (auth.uid() = user_id);

drop policy if exists "products_select_own" on public.products;
create policy "products_select_own" on public.products for select using (auth.uid() = user_id);
drop policy if exists "products_insert_own" on public.products;
create policy "products_insert_own" on public.products for insert with check (auth.uid() = user_id);
drop policy if exists "products_update_own" on public.products;
create policy "products_update_own" on public.products for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "products_delete_own" on public.products;
create policy "products_delete_own" on public.products for delete using (auth.uid() = user_id);

drop policy if exists "invoice_sequences_select_own" on public.invoice_sequences;
create policy "invoice_sequences_select_own" on public.invoice_sequences for select using (auth.uid() = user_id);
drop policy if exists "invoice_sequences_insert_own" on public.invoice_sequences;
create policy "invoice_sequences_insert_own" on public.invoice_sequences for insert with check (auth.uid() = user_id);
drop policy if exists "invoice_sequences_update_own" on public.invoice_sequences;
create policy "invoice_sequences_update_own" on public.invoice_sequences for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "invoice_sequences_delete_own" on public.invoice_sequences;
create policy "invoice_sequences_delete_own" on public.invoice_sequences for delete using (auth.uid() = user_id);

drop policy if exists "invoices_select_own" on public.invoices;
create policy "invoices_select_own" on public.invoices for select using (auth.uid() = user_id);
drop policy if exists "invoices_insert_own" on public.invoices;
create policy "invoices_insert_own" on public.invoices for insert with check (auth.uid() = user_id);
drop policy if exists "invoices_update_own" on public.invoices;
create policy "invoices_update_own" on public.invoices for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "invoices_delete_own" on public.invoices;
create policy "invoices_delete_own" on public.invoices for delete using (auth.uid() = user_id);

drop policy if exists "invoice_items_select_own" on public.invoice_items;
create policy "invoice_items_select_own"
on public.invoice_items for select
using (exists (select 1 from public.invoices i where i.id = invoice_id and i.user_id = auth.uid()));
drop policy if exists "invoice_items_insert_own" on public.invoice_items;
create policy "invoice_items_insert_own"
on public.invoice_items for insert
with check (exists (select 1 from public.invoices i where i.id = invoice_id and i.user_id = auth.uid()));
drop policy if exists "invoice_items_update_own" on public.invoice_items;
create policy "invoice_items_update_own"
on public.invoice_items for update
using (exists (select 1 from public.invoices i where i.id = invoice_id and i.user_id = auth.uid()))
with check (exists (select 1 from public.invoices i where i.id = invoice_id and i.user_id = auth.uid()));
drop policy if exists "invoice_items_delete_own" on public.invoice_items;
create policy "invoice_items_delete_own"
on public.invoice_items for delete
using (exists (select 1 from public.invoices i where i.id = invoice_id and i.user_id = auth.uid()));

drop policy if exists "invoice_history_select_own" on public.invoice_history;
create policy "invoice_history_select_own"
on public.invoice_history for select
using (exists (select 1 from public.invoices i where i.id = invoice_id and i.user_id = auth.uid()));
drop policy if exists "invoice_history_insert_own" on public.invoice_history;
create policy "invoice_history_insert_own"
on public.invoice_history for insert
with check (exists (select 1 from public.invoices i where i.id = invoice_id and i.user_id = auth.uid()));
drop policy if exists "invoice_history_update_own" on public.invoice_history;
create policy "invoice_history_update_own"
on public.invoice_history for update
using (exists (select 1 from public.invoices i where i.id = invoice_id and i.user_id = auth.uid()))
with check (exists (select 1 from public.invoices i where i.id = invoice_id and i.user_id = auth.uid()));
drop policy if exists "invoice_history_delete_own" on public.invoice_history;
create policy "invoice_history_delete_own"
on public.invoice_history for delete
using (exists (select 1 from public.invoices i where i.id = invoice_id and i.user_id = auth.uid()));

drop policy if exists "invoice_pdf_exports_select_own" on public.invoice_pdf_exports;
create policy "invoice_pdf_exports_select_own" on public.invoice_pdf_exports for select using (auth.uid() = user_id);
drop policy if exists "invoice_pdf_exports_insert_own" on public.invoice_pdf_exports;
create policy "invoice_pdf_exports_insert_own" on public.invoice_pdf_exports for insert with check (auth.uid() = user_id);
drop policy if exists "invoice_pdf_exports_delete_own" on public.invoice_pdf_exports;
create policy "invoice_pdf_exports_delete_own" on public.invoice_pdf_exports for delete using (auth.uid() = user_id);

-- Storage bucket policies. Create the buckets in the dashboard first:
-- - logos (private)
-- - invoice-pdfs (private)
drop policy if exists "logos_insert_own" on storage.objects;
create policy "logos_insert_own"
on storage.objects for insert to authenticated
with check (bucket_id = 'logos' and (storage.foldername(name))[1] = (select auth.uid()::text));
drop policy if exists "logos_select_own" on storage.objects;
create policy "logos_select_own"
on storage.objects for select to authenticated
using (bucket_id = 'logos' and (storage.foldername(name))[1] = (select auth.uid()::text));
drop policy if exists "logos_delete_own" on storage.objects;
create policy "logos_delete_own"
on storage.objects for delete to authenticated
using (bucket_id = 'logos' and (storage.foldername(name))[1] = (select auth.uid()::text));

drop policy if exists "invoice_pdfs_insert_own" on storage.objects;
create policy "invoice_pdfs_insert_own"
on storage.objects for insert to authenticated
with check (bucket_id = 'invoice-pdfs' and (storage.foldername(name))[1] = (select auth.uid()::text));
drop policy if exists "invoice_pdfs_select_own" on storage.objects;
create policy "invoice_pdfs_select_own"
on storage.objects for select to authenticated
using (bucket_id = 'invoice-pdfs' and (storage.foldername(name))[1] = (select auth.uid()::text));
drop policy if exists "invoice_pdfs_delete_own" on storage.objects;
create policy "invoice_pdfs_delete_own"
on storage.objects for delete to authenticated
using (bucket_id = 'invoice-pdfs' and (storage.foldername(name))[1] = (select auth.uid()::text));

create or replace function public.upsert_customer_from_invoice(
  p_name text,
  p_phone text,
  p_email text,
  p_gst text,
  p_address text
) returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  target_user uuid := auth.uid();
  identity_key text := concat_ws('|', nullif(trim(coalesce(p_phone, '')), ''), nullif(trim(coalesce(p_gst, '')), ''), lower(trim(coalesce(p_name, ''))));
begin
  if target_user is null or identity_key = '' then
    return;
  end if;

  insert into public.customers (user_id, identity_key, name, phone, email, gst, address)
  values (target_user, identity_key, coalesce(p_name, ''), coalesce(p_phone, ''), coalesce(p_email, ''), coalesce(p_gst, ''), coalesce(p_address, ''))
  on conflict (user_id, identity_key)
  do update set
    name = excluded.name,
    phone = excluded.phone,
    email = excluded.email,
    gst = excluded.gst,
    address = excluded.address,
    updated_at = now();
end;
$$;

create unique index if not exists customers_user_identity_unique_idx on public.customers(user_id, identity_key);

create or replace function public.create_invoice_record(p_invoice jsonb)
returns jsonb
language sql
security definer
set search_path = public
as $$
with ensure_settings as (
  insert into public.user_settings (user_id)
  values (auth.uid())
  on conflict (user_id) do nothing
  returning user_id
),
settings as (
  select
    auth.uid() as target_user,
    coalesce(us.reset_yearly, true) as reset_yearly,
    public.normalize_reset_month_day(coalesce(us.invoice_reset_month_day, '01-01')) as reset_month_day,
    greatest(coalesce(us.invoice_start_number, 1), 1)::bigint as invoice_start_number,
    coalesce(us.invoice_prefix, 'INV-') as invoice_prefix,
    greatest(coalesce(us.invoice_padding, 4), 1)::int as invoice_padding,
    (p_invoice->>'date')::date as invoice_date_value,
    coalesce(p_invoice->'customDetails', '[]'::jsonb) as custom_details_value,
    coalesce(p_invoice->>'notes', '') as notes_value,
    nullif(trim(coalesce(p_invoice->>'duplicateSourceInvoiceNumber', '')), '') as duplicate_source_invoice_number
  from public.user_settings us
  where us.user_id = auth.uid()
),
scope as (
  select
    s.target_user,
    s.reset_yearly,
    s.reset_month_day,
    s.invoice_start_number,
    s.invoice_prefix,
    s.invoice_padding,
    s.invoice_date_value,
    s.custom_details_value,
    s.notes_value,
    s.duplicate_source_invoice_number,
    c.numbering_mode,
    c.scope_key,
    c.window_start,
    c.window_end,
    case when s.reset_yearly then s.reset_month_day else null end as sequence_reset_month_day,
    greatest(s.invoice_start_number - 1, 0)::bigint as sequence_seed,
    case when c.numbering_mode = 'financial-year-reset' then s.reset_month_day else null end as reset_month_day_at_creation,
    'inv_' || replace(gen_random_uuid()::text, '-', '') as invoice_id_value,
    now() as created_at_value
  from settings s
  cross join lateral public.compute_invoice_scope(s.invoice_date_value, s.reset_yearly, s.reset_month_day) c
),
ensure_sequence as (
  insert into public.invoice_sequences (
    user_id, scope_key, numbering_mode, scope_start, scope_end, reset_month_day, last_value
  )
  select
    sc.target_user,
    sc.scope_key,
    sc.numbering_mode,
    sc.window_start,
    sc.window_end,
    sc.sequence_reset_month_day,
    sc.sequence_seed
  from scope sc
  on conflict (user_id, scope_key) do nothing
  returning id
),
locked_sequence as (
  select
    seq.id,
    seq.last_value,
    sc.*
  from public.invoice_sequences seq
  join scope sc
    on seq.user_id = sc.target_user
   and seq.scope_key = sc.scope_key
  for update
),
bumped_sequence as (
  update public.invoice_sequences seq
  set
    last_value = greatest(ls.last_value + 1, ls.invoice_start_number),
    updated_at = now()
  from locked_sequence ls
  where seq.id = ls.id
  returning
    greatest(ls.last_value + 1, ls.invoice_start_number)::bigint as next_value,
    ls.target_user,
    ls.numbering_mode,
    ls.window_start,
    ls.window_end,
    ls.reset_month_day_at_creation,
    ls.invoice_prefix,
    ls.invoice_padding,
    ls.invoice_date_value,
    ls.custom_details_value,
    ls.notes_value,
    ls.duplicate_source_invoice_number,
    ls.invoice_id_value,
    ls.created_at_value
),
inserted_invoice as (
  insert into public.invoices (
    id, user_id, invoice_number, created_at, invoice_date,
    numbering_mode_at_creation, reset_month_day_at_creation, sequence_window_start, sequence_window_end,
    client_name, client_phone, client_email, client_gst, client_address,
    custom_details, notes, status, grand_total
  )
  select
    bs.invoice_id_value,
    bs.target_user,
    bs.invoice_prefix || lpad(bs.next_value::text, bs.invoice_padding, '0'),
    bs.created_at_value,
    bs.invoice_date_value,
    bs.numbering_mode,
    bs.reset_month_day_at_creation,
    bs.window_start,
    bs.window_end,
    coalesce(p_invoice->>'clientName', ''),
    coalesce(p_invoice->>'clientPhone', ''),
    coalesce(p_invoice->>'clientEmail', ''),
    coalesce(p_invoice->>'clientGST', ''),
    coalesce(p_invoice->>'clientAddress', ''),
    bs.custom_details_value,
    bs.notes_value,
    coalesce(nullif(p_invoice->>'status', ''), 'draft'),
    coalesce((p_invoice->>'grandTotal')::numeric, 0)
  from bumped_sequence bs
  returning
    id,
    invoice_number,
    created_at,
    numbering_mode_at_creation,
    reset_month_day_at_creation,
    sequence_window_start,
    sequence_window_end
),
inserted_items as (
  insert into public.invoice_items (
    invoice_id, position, product, hsn, qty, unit, price, cgst, sgst, igst, total
  )
  select
    ii.id,
    case
      when jsonb_typeof(item.value->'position') = 'number' then (item.value->>'position')::int
      else item.ordinality::int - 1
    end,
    coalesce(item.value->>'product', ''),
    coalesce(item.value->>'hsn', ''),
    coalesce((item.value->>'qty')::numeric, 0),
    coalesce(item.value->>'unit', ''),
    coalesce((item.value->>'price')::numeric, 0),
    coalesce((item.value->>'cgst')::numeric, 0),
    coalesce((item.value->>'sgst')::numeric, 0),
    coalesce((item.value->>'igst')::numeric, 0),
    coalesce((item.value->>'total')::numeric, 0)
  from inserted_invoice ii
  cross join lateral jsonb_array_elements(coalesce(p_invoice->'items', '[]'::jsonb)) with ordinality as item(value, ordinality)
  returning invoice_id
),
created_history as (
  insert into public.invoice_history (id, invoice_id, event_type, label, happened_at)
  select
    'invh_' || replace(gen_random_uuid()::text, '-', ''),
    ii.id,
    'created',
    'Invoice created',
    ii.created_at
  from inserted_invoice ii
  returning invoice_id
),
duplicated_history as (
  insert into public.invoice_history (id, invoice_id, event_type, label, happened_at)
  select
    'invh_' || replace(gen_random_uuid()::text, '-', ''),
    ii.id,
    'duplicated',
    'Duplicated from ' || bs.duplicate_source_invoice_number,
    ii.created_at
  from inserted_invoice ii
  join bumped_sequence bs on true
  where bs.duplicate_source_invoice_number is not null
  returning invoice_id
),
customer_touch as (
  select public.upsert_customer_from_invoice(
    p_invoice->>'clientName',
    p_invoice->>'clientPhone',
    p_invoice->>'clientEmail',
    p_invoice->>'clientGST',
    p_invoice->>'clientAddress'
  )
)
select jsonb_build_object(
  'id', ii.id,
  'invoiceNumber', ii.invoice_number,
  'createdAt', ii.created_at,
  'numberingModeAtCreation', ii.numbering_mode_at_creation,
  'resetMonthDayAtCreation', ii.reset_month_day_at_creation,
  'sequenceWindowStart', ii.sequence_window_start,
  'sequenceWindowEnd', ii.sequence_window_end
)
from inserted_invoice ii;
$$;

create or replace function public.update_invoice_record(p_invoice jsonb)
returns jsonb
language sql
security definer
set search_path = public
as $$
with target_invoice as (
  select *
  from public.invoices
  where id = p_invoice->>'id'
    and user_id = auth.uid()
  for update
),
updated_invoice as (
  update public.invoices i
  set
    client_name = coalesce(p_invoice->>'clientName', ''),
    client_phone = coalesce(p_invoice->>'clientPhone', ''),
    client_email = coalesce(p_invoice->>'clientEmail', ''),
    client_gst = coalesce(p_invoice->>'clientGST', ''),
    client_address = coalesce(p_invoice->>'clientAddress', ''),
    custom_details = coalesce(p_invoice->'customDetails', '[]'::jsonb),
    notes = coalesce(p_invoice->>'notes', ''),
    status = coalesce(nullif(p_invoice->>'status', ''), t.status),
    grand_total = coalesce((p_invoice->>'grandTotal')::numeric, t.grand_total),
    updated_at = now()
  from target_invoice t
  where i.id = t.id
  returning
    i.id,
    i.invoice_number,
    i.created_at,
    i.numbering_mode_at_creation,
    i.reset_month_day_at_creation,
    i.sequence_window_start,
    i.sequence_window_end
),
deleted_items as (
  delete from public.invoice_items
  where invoice_id in (select id from updated_invoice)
  returning invoice_id
),
inserted_items as (
  insert into public.invoice_items (
    invoice_id, position, product, hsn, qty, unit, price, cgst, sgst, igst, total
  )
  select
    ui.id,
    case
      when jsonb_typeof(item.value->'position') = 'number' then (item.value->>'position')::int
      else item.ordinality::int - 1
    end,
    coalesce(item.value->>'product', ''),
    coalesce(item.value->>'hsn', ''),
    coalesce((item.value->>'qty')::numeric, 0),
    coalesce(item.value->>'unit', ''),
    coalesce((item.value->>'price')::numeric, 0),
    coalesce((item.value->>'cgst')::numeric, 0),
    coalesce((item.value->>'sgst')::numeric, 0),
    coalesce((item.value->>'igst')::numeric, 0),
    coalesce((item.value->>'total')::numeric, 0)
  from updated_invoice ui
  cross join lateral jsonb_array_elements(coalesce(p_invoice->'items', '[]'::jsonb)) with ordinality as item(value, ordinality)
  returning invoice_id
),
history_entry as (
  insert into public.invoice_history (id, invoice_id, event_type, label, happened_at)
  select
    coalesce(nullif(p_invoice->>'historyId', ''), 'invh_' || replace(gen_random_uuid()::text, '-', '')),
    ui.id,
    'edited',
    'Invoice edited',
    now()
  from updated_invoice ui
  returning invoice_id
),
customer_touch as (
  select public.upsert_customer_from_invoice(
    p_invoice->>'clientName',
    p_invoice->>'clientPhone',
    p_invoice->>'clientEmail',
    p_invoice->>'clientGST',
    p_invoice->>'clientAddress'
  )
  from updated_invoice
)
select jsonb_build_object(
  'id', ui.id,
  'invoiceNumber', ui.invoice_number,
  'createdAt', ui.created_at,
  'numberingModeAtCreation', ui.numbering_mode_at_creation,
  'resetMonthDayAtCreation', ui.reset_month_day_at_creation,
  'sequenceWindowStart', ui.sequence_window_start,
  'sequenceWindowEnd', ui.sequence_window_end
)
from updated_invoice ui;
$$;

create or replace function public.delete_invoice_record(p_invoice_id text)
returns boolean
language sql
security definer
set search_path = public
as $$
with deleted_invoice as (
  delete from public.invoices
  where id = p_invoice_id
    and user_id = auth.uid()
  returning id
)
select exists(select 1 from deleted_invoice);
$$;
