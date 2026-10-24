-- One row of progress per signed-in learner. The app is local-first: this table only
-- mirrors what is in the browser so a learner can pick up on another device.

create table if not exists public.progress (
  user_id uuid primary key references auth.users (id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  constraint progress_data_size check (pg_column_size(data) < 2000000)
);

alter table public.progress enable row level security;

-- Each learner can only see and change their own row.
create policy "progress: read own" on public.progress
  for select to authenticated using (auth.uid() = user_id);

create policy "progress: insert own" on public.progress
  for insert to authenticated with check (auth.uid() = user_id);

create policy "progress: update own" on public.progress
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "progress: delete own" on public.progress
  for delete to authenticated using (auth.uid() = user_id);
