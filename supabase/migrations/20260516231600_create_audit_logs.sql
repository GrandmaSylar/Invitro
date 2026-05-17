create table public.audit_logs (
  id uuid default gen_random_uuid() primary key,
  actor_id text not null,
  actor_name text not null,
  action text not null,
  target_type text not null,
  target_id text not null,
  target_name text not null,
  detail text,
  timestamp timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.audit_logs enable row level security;

create policy "Allow all authenticated users to view audit logs" on public.audit_logs for select to authenticated using (true);
create policy "Allow all authenticated users to insert audit logs" on public.audit_logs for insert to authenticated with check (true);
