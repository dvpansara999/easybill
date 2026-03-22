-- easyBILL minimal schema (cost-friendly)
-- Run in Supabase SQL editor.

-- 1) Key/value store for user-scoped JSON.
create table if not exists public.user_kv (
  user_id uuid not null references auth.users(id) on delete cascade,
  key text not null,
  value jsonb not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, key)
);

create index if not exists user_kv_user_id_idx on public.user_kv (user_id);

-- Keep updated_at fresh.
create or replace function public.touch_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists user_kv_touch on public.user_kv;
create trigger user_kv_touch
before update on public.user_kv
for each row execute function public.touch_updated_at();

-- 2) Enable RLS.
alter table public.user_kv enable row level security;

-- Only the signed-in user can access their rows.
drop policy if exists "user_kv_select_own" on public.user_kv;
create policy "user_kv_select_own"
on public.user_kv for select
using (auth.uid() = user_id);

drop policy if exists "user_kv_insert_own" on public.user_kv;
create policy "user_kv_insert_own"
on public.user_kv for insert
with check (auth.uid() = user_id);

drop policy if exists "user_kv_update_own" on public.user_kv;
create policy "user_kv_update_own"
on public.user_kv for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "user_kv_delete_own" on public.user_kv;
create policy "user_kv_delete_own"
on public.user_kv for delete
using (auth.uid() = user_id);

-- 3) Storage bucket for logos (optional).
-- Create a bucket named 'logos' in the Supabase dashboard.
-- Set bucket privacy to: public OR private (private is safer).
-- If private, we'll use signed URLs.

-- 4) Invoice PDF export (storage + metadata + cron purge): see invoice_pdf_exports.sql

