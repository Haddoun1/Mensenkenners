-- Groepen: elke deelnemer hoort bij een groep, en admins zien alleen de gegevens van hun eigen groep.
--
-- Rollen in profiles.role:
--   - 'user'        gewone deelnemer;
--   - 'admin'       ziet voortgang en antwoorden van deelnemers uit de eigen groep (profiles.group_id);
--   - 'superadmin'  hoofdadmin: ziet alle groepen, beheert de groepen en koppelt admins aan een groep.
--
-- Voer dit uit NA supabase/security_rls.sql.
-- Uitvoeren in Supabase: SQL Editor > New query > dit hele bestand plakken > Run.
-- Het script kan veilig opnieuw worden uitgevoerd.


-- 1. Tabel met groepen + groep per profiel.
create table if not exists public.groups (
  id uuid primary key default gen_random_uuid(),
  name text not null unique check (length(trim(name)) between 1 and 100),
  created_at timestamptz not null default now()
);

alter table public.profiles
  add column if not exists group_id uuid references public.groups (id) on delete set null;


-- 2. De rol 'superadmin' toestaan. Een eventuele oude check op de rol wordt vervangen.
do $$
declare
  c record;
begin
  for c in
    select conname
    from pg_constraint
    where conrelid = 'public.profiles'::regclass
      and contype = 'c'
      and pg_get_constraintdef(oid) ilike '%role%'
  loop
    execute format('alter table public.profiles drop constraint %I', c.conname);
  end loop;
end $$;

alter table public.profiles
  add constraint profiles_role_check check (role is null or role in ('user', 'admin', 'superadmin')) not valid;


-- 3. Hulpfuncties. "security definer" zodat ze profiles mogen lezen zonder zelf door RLS geblokkeerd te worden.

-- Admin of hoofdadmin? (Vervangt de versie uit security_rls.sql.)
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('admin', 'superadmin')
  );
$$;

create or replace function public.is_superadmin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'superadmin'
  );
$$;

-- Mag de ingelogde admin de gegevens van deze gebruiker zien?
-- Hoofdadmin: altijd. Admin: alleen als de gebruiker in dezelfde groep zit.
-- (Tekst als parameter, zodat het werkt of user_id nu uuid of text is.)
create or replace function public.can_see_user(target_user text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles me
    where me.id = auth.uid()
      and (
        me.role = 'superadmin'
        or (
          me.role = 'admin'
          and me.group_id is not null
          and exists (
            select 1 from public.profiles target
            where target.id::text = target_user
              and target.group_id = me.group_id
          )
        )
      )
  );
$$;

-- Een deelnemer kiest zelf één keer een groep. Daarna kan alleen de hoofdadmin de groep nog wijzigen
-- (via /api/admin-role). Zo kan niemand een eigen rol of andermans profiel aanpassen.
create or replace function public.set_my_group(new_group uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Niet ingelogd';
  end if;

  if not exists (select 1 from public.groups where id = new_group) then
    raise exception 'Onbekende groep';
  end if;

  -- Admins kiezen niet zelf een groep: anders kan een admin zonder groep zich bij elke groep
  -- aansluiten en de gegevens daarvan zien. De hoofdadmin koppelt admins aan een groep.
  if exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'superadmin')) then
    raise exception 'Admins krijgen hun groep van de hoofdadmin';
  end if;

  update public.profiles
  set group_id = new_group
  where id = auth.uid() and group_id is null;

  if not found and not exists (select 1 from public.profiles where id = auth.uid()) then
    raise exception 'Geen profiel gevonden';
  end if;
end;
$$;

revoke all on function public.is_admin() from public, anon;
revoke all on function public.is_superadmin() from public, anon;
revoke all on function public.can_see_user(text) from public, anon;
revoke all on function public.set_my_group(uuid) from public, anon;
grant execute on function public.is_admin() to authenticated;
grant execute on function public.is_superadmin() to authenticated;
grant execute on function public.can_see_user(text) to authenticated;
grant execute on function public.set_my_group(uuid) to authenticated;


-- 4. groups: iedereen mag de namen lezen (nodig voor de keuzelijst bij registreren, vóór het inloggen);
--    alleen de hoofdadmin mag groepen toevoegen, hernoemen of verwijderen.
alter table public.groups enable row level security;

drop policy if exists "Groepen lezen" on public.groups;
drop policy if exists "Hoofdadmin beheert groepen" on public.groups;

create policy "Groepen lezen"
  on public.groups for select
  to anon, authenticated
  using (true);

create policy "Hoofdadmin beheert groepen"
  on public.groups for all
  to authenticated
  using (public.is_superadmin())
  with check (public.is_superadmin());


-- 5. Admins lezen voortaan alleen hun eigen groep (vervangt de "alles lezen"-policies uit security_rls.sql).
drop policy if exists "Admins lezen alle voortgang" on public.course_progress;
drop policy if exists "Admins lezen alle profielen" on public.profiles;
drop policy if exists "Admins lezen alle antwoorden" on public.course_answers;
drop policy if exists "Admins lezen voortgang van hun groep" on public.course_progress;
drop policy if exists "Admins lezen profielen van hun groep" on public.profiles;
drop policy if exists "Admins lezen antwoorden van hun groep" on public.course_answers;

create policy "Admins lezen voortgang van hun groep"
  on public.course_progress for select
  to authenticated
  using (public.can_see_user(user_id::text));

create policy "Admins lezen profielen van hun groep"
  on public.profiles for select
  to authenticated
  using (public.can_see_user(id::text));

create policy "Admins lezen antwoorden van hun groep"
  on public.course_answers for select
  to authenticated
  using (public.can_see_user(user_id::text));


-- 6. Startgroepen. Bestaan ze al, dan gebeurt er niets. Later beheert de hoofdadmin de groepen in het adminpaneel.
insert into public.groups (name)
values ('Groep A'), ('Groep B')
on conflict (name) do nothing;


-- 7. De eerste hoofdadmin aanwijzen: haal de -- weg en vul het e-mailadres in.
-- update public.profiles set role = 'superadmin' where email = 'naam@voorbeeld.nl';


-- 8. Controle: tabellen in "public" waar RLS nog uit staat. Hoort een lege lijst te geven.
select tablename as "RLS staat nog uit"
from pg_tables
where schemaname = 'public' and rowsecurity = false;
