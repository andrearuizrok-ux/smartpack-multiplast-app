-- Piattaforma Operativa Integrata · schema cloud V10.1
-- Eseguire su un progetto Supabase DEDICATO al Gruppo Smart Pack – Multiplast.

create table if not exists public.poi_user_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  group_code text not null default 'smartpack-multiplast',
  display_name text not null default '',
  allowed_roles text[] not null default '{}'::text[],
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.poi_app_segments (
  group_code text not null,
  segment_key text not null,
  data jsonb not null default 'null'::jsonb,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id) on delete set null,
  primary key (group_code, segment_key)
);

create or replace function public.poi_touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at=now(); return new; end $$;

drop trigger if exists poi_user_profiles_touch on public.poi_user_profiles;
create trigger poi_user_profiles_touch before update on public.poi_user_profiles for each row execute function public.poi_touch_updated_at();
drop trigger if exists poi_app_segments_touch on public.poi_app_segments;
create trigger poi_app_segments_touch before update on public.poi_app_segments for each row execute function public.poi_touch_updated_at();

alter table public.poi_user_profiles enable row level security;
alter table public.poi_app_segments enable row level security;

grant select on public.poi_user_profiles to authenticated;
grant select, insert, update on public.poi_app_segments to authenticated;

create or replace function public.poi_can_read_segment(p_group text,p_segment text)
returns boolean language sql stable security definer set search_path=public as $$
  select coalesce((
    select case
      when not p.active then false
      when 'admin'=any(p.allowed_roles) then true
      when 'director'=any(p.allowed_roles) and p_segment not like 'mp.%' then true
      when 'manager'=any(p.allowed_roles) and p_segment like 'mp.%' then true
      when 'worker'=any(p.allowed_roles) and p_segment = any(array[
        'settings','orders','products','imls','imlLots','machines','molds','operators','productionSheets','production','productionRuns','productionEvents','mixtures','warehouseAllocations','warehousePreparationEvents','finishedGoodsLots','finishedGoodsMovements','imlUsageEvents','directorMessages','audit'
      ]) then true
      when 'mpworker'=any(p.allowed_roles) and p_segment = any(array[
        'mp.presses','mp.models','mp.deliveries','mp.tasks','mp.fgStock','mp.fgMoves','mp.materialLots','mp.materialMoves','mp.mixtures','mp.shifts','mp.instructions','mp.operators'
      ]) then true
      else false end
    from public.poi_user_profiles p where p.user_id=auth.uid() and p.group_code=p_group limit 1
  ),false)
$$;

create or replace function public.poi_can_write_segment(p_group text,p_segment text)
returns boolean language sql stable security definer set search_path=public as $$
  select coalesce((
    select case
      when not p.active then false
      when 'director'=any(p.allowed_roles) and p_segment not like 'mp.%' then true
      when 'manager'=any(p.allowed_roles) and p_segment like 'mp.%' then true
      when 'admin'=any(p.allowed_roles) and p_segment = any(array[
        'orders','deliveryRecords','warehouseAllocations','warehousePreparationEvents','finishedGoodsLots','finishedGoodsMovements','audit','mp.deliveries','mp.fgStock','mp.fgMoves'
      ]) then true
      when 'worker'=any(p.allowed_roles) and p_segment = any(array[
        'productionSheets','production','productionRuns','productionEvents','mixtures','operators','warehousePreparationEvents','directorMessages','audit','imls','imlLots','imlUsageEvents','finishedGoodsLots','finishedGoodsMovements'
      ]) then true
      when 'mpworker'=any(p.allowed_roles) and p_segment = any(array[
        'mp.shifts','mp.mixtures','mp.materialLots','mp.materialMoves','mp.fgStock','mp.fgMoves','mp.tasks','mp.operators'
      ]) then true
      else false end
    from public.poi_user_profiles p where p.user_id=auth.uid() and p.group_code=p_group limit 1
  ),false)
$$;

-- Ogni utente legge soltanto il proprio profilo.
drop policy if exists "poi_profile_self_read" on public.poi_user_profiles;
create policy "poi_profile_self_read" on public.poi_user_profiles for select to authenticated using (user_id=auth.uid());

-- Segmenti dati: lettura/scrittura autorizzate in funzione dei ruoli assegnati all'account.
drop policy if exists "poi_segments_read" on public.poi_app_segments;
create policy "poi_segments_read" on public.poi_app_segments for select to authenticated using (public.poi_can_read_segment(group_code,segment_key));
drop policy if exists "poi_segments_insert" on public.poi_app_segments;
create policy "poi_segments_insert" on public.poi_app_segments for insert to authenticated with check (public.poi_can_write_segment(group_code,segment_key) and updated_by=auth.uid());
drop policy if exists "poi_segments_update" on public.poi_app_segments;
create policy "poi_segments_update" on public.poi_app_segments for update to authenticated using (public.poi_can_write_segment(group_code,segment_key)) with check (public.poi_can_write_segment(group_code,segment_key) and updated_by=auth.uid());

-- Realtime Postgres Changes per la sincronizzazione tra dispositivi.
do $$ begin
  if not exists (select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='poi_app_segments') then
    alter publication supabase_realtime add table public.poi_app_segments;
  end if;
end $$;
