-- Persisted invoice PDFs (export flow) - secure schema.
-- Use this when you are okay resetting existing PDF cache data.

-- 1) Storage: Dashboard -> Storage -> New bucket -> name: invoice-pdfs
--    - Keep the bucket private. The app now serves signed URLs when needed.

-- 2) Policies for authenticated users (upload/read/delete own folder = first path segment = user uuid)

drop policy if exists "invoice_pdfs_insert_own" on storage.objects;
create policy "invoice_pdfs_insert_own"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'invoice-pdfs'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
);

drop policy if exists "invoice_pdfs_select_own" on storage.objects;
create policy "invoice_pdfs_select_own"
on storage.objects for select to authenticated
using (
  bucket_id = 'invoice-pdfs'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
);

drop policy if exists "invoice_pdfs_delete_own" on storage.objects;
create policy "invoice_pdfs_delete_own"
on storage.objects for delete to authenticated
using (
  bucket_id = 'invoice-pdfs'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
);

-- 3) Fresh metadata table keyed by invoice_id + source_fingerprint.
drop table if exists public.invoice_pdf_exports;

create table public.invoice_pdf_exports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  invoice_id text not null,
  invoice_number text not null,
  source_fingerprint text not null,
  storage_path text not null,
  last_accessed_at timestamptz,
  created_at timestamptz not null default now(),
  unique (user_id, invoice_id, source_fingerprint)
);

create index invoice_pdf_exports_user_invoice_created_idx
  on public.invoice_pdf_exports (user_id, invoice_id, created_at desc);

create index invoice_pdf_exports_user_created_idx
  on public.invoice_pdf_exports (user_id, created_at desc);

create index invoice_pdf_exports_purge_idx
  on public.invoice_pdf_exports (created_at);

alter table public.invoice_pdf_exports enable row level security;

drop policy if exists "invoice_pdf_exports_select_own" on public.invoice_pdf_exports;
create policy "invoice_pdf_exports_select_own"
on public.invoice_pdf_exports for select to authenticated
using (auth.uid() = user_id);

drop policy if exists "invoice_pdf_exports_insert_own" on public.invoice_pdf_exports;
create policy "invoice_pdf_exports_insert_own"
on public.invoice_pdf_exports for insert to authenticated
with check (auth.uid() = user_id);

drop policy if exists "invoice_pdf_exports_delete_own" on public.invoice_pdf_exports;
create policy "invoice_pdf_exports_delete_own"
on public.invoice_pdf_exports for delete to authenticated
using (auth.uid() = user_id);

-- 4) Cron: set CRON_SECRET in Vercel and SUPABASE_SERVICE_ROLE_KEY for purge routes.
