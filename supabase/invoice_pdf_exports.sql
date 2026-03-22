-- Persisted invoice PDFs (export flow). Run in Supabase SQL editor after creating the bucket.

-- 1) Storage: Dashboard → Storage → New bucket → name: invoice-pdfs
--    - Enable "Public bucket" so getPublicUrl works for share/download links.
--    Or keep private and switch app to signed URLs later.

-- 2) Policies for authenticated users (upload/read/delete own folder = first path segment = user uuid)

-- INSERT: only into folder named own user id
drop policy if exists "invoice_pdfs_insert_own" on storage.objects;
create policy "invoice_pdfs_insert_own"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'invoice-pdfs'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
);

-- SELECT: read own objects (optional if bucket is fully public)
drop policy if exists "invoice_pdfs_select_own" on storage.objects;
create policy "invoice_pdfs_select_own"
on storage.objects for select to authenticated
using (
  bucket_id = 'invoice-pdfs'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
);

-- DELETE: own objects (cron uses service role and bypasses RLS)
drop policy if exists "invoice_pdfs_delete_own" on storage.objects;
create policy "invoice_pdfs_delete_own"
on storage.objects for delete to authenticated
using (
  bucket_id = 'invoice-pdfs'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
);

-- 3) Metadata table
create table if not exists public.invoice_pdf_exports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  invoice_number text not null,
  storage_path text not null,
  public_url text not null,
  created_at timestamptz not null default now()
);

create index if not exists invoice_pdf_exports_user_created_idx
  on public.invoice_pdf_exports (user_id, created_at desc);

create index if not exists invoice_pdf_exports_purge_idx
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

-- 4) Cron: set CRON_SECRET in Vercel and SUPABASE_SERVICE_ROLE_KEY for purge route.
