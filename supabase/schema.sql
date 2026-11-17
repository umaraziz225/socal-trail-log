-- SoCal Trail Log: schema, Row Level Security and storage.
-- Paste into the Supabase SQL editor and run once (safe to re-run).

-- ---------------------------------------------------------------- tables
create table if not exists public.trails (
  id                  uuid primary key default gen_random_uuid(),
  slug                text not null unique,
  name                text not null,
  region              text not null,
  distance_miles      numeric(5,1) not null check (distance_miles > 0),
  elevation_gain_ft   integer not null check (elevation_gain_ft >= 0),
  summit_elevation_ft integer not null check (summit_elevation_ft >= 0),
  difficulty          text not null check (difficulty in ('Easy','Moderate','Hard','Strenuous')),
  est_time            text,
  trailhead           text,
  description         text,
  is_six_pack         boolean not null default false,
  image_url           text,
  image_credit        text,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create table if not exists public.admins (
  user_id uuid primary key references auth.users (id) on delete cascade
);

create table if not exists public.user_hikes (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users (id) on delete cascade,
  trail_id     uuid not null references public.trails (id) on delete cascade,
  completed_on date not null,
  note         text check (char_length(note) <= 300),
  created_at   timestamptz not null default now(),
  unique (user_id, trail_id)
);

create table if not exists public.contact_messages (
  id         uuid primary key default gen_random_uuid(),
  name       text not null check (char_length(name) between 1 and 100),
  email      text not null check (char_length(email) between 3 and 200),
  message    text not null check (char_length(message) between 1 and 2000),
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------- helper
-- security definer so policies can read admins without exposing the table.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.admins where user_id = auth.uid());
$$;

-- ---------------------------------------------------------------- RLS
alter table public.trails           enable row level security;
alter table public.admins           enable row level security;
alter table public.user_hikes       enable row level security;
alter table public.contact_messages enable row level security;

-- trails: public read, admin write
drop policy if exists "trails_select_all"   on public.trails;
drop policy if exists "trails_admin_insert" on public.trails;
drop policy if exists "trails_admin_update" on public.trails;
drop policy if exists "trails_admin_delete" on public.trails;
create policy "trails_select_all"   on public.trails for select using (true);
create policy "trails_admin_insert" on public.trails for insert with check (public.is_admin());
create policy "trails_admin_update" on public.trails for update using (public.is_admin()) with check (public.is_admin());
create policy "trails_admin_delete" on public.trails for delete using (public.is_admin());

-- admins: a user can see only their own row (no write policies: add admins from the SQL editor)
drop policy if exists "admins_select_own" on public.admins;
create policy "admins_select_own" on public.admins for select using (user_id = auth.uid());

-- user_hikes: each user manages only their own rows
drop policy if exists "hikes_select_own" on public.user_hikes;
drop policy if exists "hikes_insert_own" on public.user_hikes;
drop policy if exists "hikes_update_own" on public.user_hikes;
drop policy if exists "hikes_delete_own" on public.user_hikes;
create policy "hikes_select_own" on public.user_hikes for select using (user_id = auth.uid());
create policy "hikes_insert_own" on public.user_hikes for insert with check (user_id = auth.uid());
create policy "hikes_update_own" on public.user_hikes for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "hikes_delete_own" on public.user_hikes for delete using (user_id = auth.uid());

-- contact_messages: anyone can send, only admins can read or delete
drop policy if exists "messages_insert_any"   on public.contact_messages;
drop policy if exists "messages_admin_select" on public.contact_messages;
drop policy if exists "messages_admin_delete" on public.contact_messages;
create policy "messages_insert_any"   on public.contact_messages for insert with check (true);
create policy "messages_admin_select" on public.contact_messages for select using (public.is_admin());
create policy "messages_admin_delete" on public.contact_messages for delete using (public.is_admin());

-- ---------------------------------------------------------------- storage
insert into storage.buckets (id, name, public)
values ('trail-photos', 'trail-photos', true)
on conflict (id) do update set public = true;

drop policy if exists "trail_photos_read"         on storage.objects;
drop policy if exists "trail_photos_admin_insert" on storage.objects;
drop policy if exists "trail_photos_admin_update" on storage.objects;
drop policy if exists "trail_photos_admin_delete" on storage.objects;
create policy "trail_photos_read"         on storage.objects for select using (bucket_id = 'trail-photos');
create policy "trail_photos_admin_insert" on storage.objects for insert with check (bucket_id = 'trail-photos' and public.is_admin());
create policy "trail_photos_admin_update" on storage.objects for update using (bucket_id = 'trail-photos' and public.is_admin()) with check (bucket_id = 'trail-photos' and public.is_admin());
create policy "trail_photos_admin_delete" on storage.objects for delete using (bucket_id = 'trail-photos' and public.is_admin());
