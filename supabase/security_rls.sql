-- Beveiliging: Row Level Security (RLS) voor alle tabellen met gebruikersdata.
--
-- Probleem: course_progress en profiles hadden geen RLS. Met de publieke (anon) sleutel uit de website
-- kon iedereen alle namen, e-mailadressen en de voortgang van alle deelnemers lezen en aanpassen.
--
-- Na dit script:
--   - deelnemers zien en schrijven alleen hun eigen gegevens;
--   - admins (profiles.role = 'admin') mogen alles lezen, maar niets van anderen aanpassen;
--   - niemand kan zichzelf admin maken (rollen wijzigen gaat alleen via /api/admin-role met de service role key);
--   - niet-ingelogde bezoekers kunnen niets lezen of schrijven.
--
-- Uitvoeren in Supabase: SQL Editor > New query > dit hele bestand plakken > Run.
-- Het script kan veilig opnieuw worden uitgevoerd.


-- 1. Hulpfunctie: is de ingelogde gebruiker admin?
--    "security definer" zodat de functie profiles mag lezen zonder zelf door RLS geblokkeerd te worden
--    (anders verwijst de policy van profiles naar zichzelf en krijg je een oneindige lus).
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;


-- 2. Bestaande policies op deze tabellen weghalen.
--    Zo blijven er geen oude "iedereen mag alles"-regels achter die de nieuwe regels zouden omzeilen.
do $$
declare
  p record;
begin
  for p in
    select policyname, tablename
    from pg_policies
    where schemaname = 'public'
      and tablename in ('course_progress', 'profiles')
  loop
    execute format('drop policy %I on public.%I', p.policyname, p.tablename);
  end loop;
end $$;

drop policy if exists "Admins lezen alle antwoorden" on public.course_answers;


-- 3. RLS aanzetten.
alter table public.course_progress enable row level security;
alter table public.profiles enable row level security;
alter table public.course_answers enable row level security;


-- 4. course_progress: eigen voortgang lezen en toevoegen; admins lezen alles.
--    Bijwerken of verwijderen mag niemand: "opnieuw starten" voegt een rij met step_id 'reset' toe.
--    (user_id::text zodat dit werkt of de kolom nu uuid of text is.)
create policy "Eigen voortgang lezen"
  on public.course_progress for select
  to authenticated
  using (user_id::text = auth.uid()::text);

create policy "Eigen voortgang toevoegen"
  on public.course_progress for insert
  to authenticated
  with check (user_id::text = auth.uid()::text);

create policy "Admins lezen alle voortgang"
  on public.course_progress for select
  to authenticated
  using (public.is_admin());


-- 5. profiles: eigen profiel lezen; admins lezen alles.
--    Geen insert/update/delete-policies: profielen worden aangemaakt door Supabase zelf (trigger)
--    en rollen worden alleen aangepast via /api/admin-role (service role key, die RLS omzeilt).
create policy "Eigen profiel lezen"
  on public.profiles for select
  to authenticated
  using (id = auth.uid());

create policy "Admins lezen alle profielen"
  on public.profiles for select
  to authenticated
  using (public.is_admin());


-- 6. course_answers: de eigen policies staan in course_answers.sql; hier alleen het leesrecht voor admins.
--    (Vervangt supabase/course_answers_admin.sql.)
create policy "Admins lezen alle antwoorden"
  on public.course_answers for select
  to authenticated
  using (public.is_admin());


-- 7. Opruimen: naam en e-mailadres horen niet in de voortgang (de site slaat ze niet meer op).
--    Wil je de kolommen helemaal weg? Haal dan de -- weg voor de twee regels eronder.
update public.course_progress set name = null, email = null
where name is not null or email is not null;
-- alter table public.course_progress drop column if exists name;
-- alter table public.course_progress drop column if exists email;


-- 8. Controle: tabellen in "public" waar RLS nog uit staat. Hoort na dit script een lege lijst te geven.
select tablename as "RLS staat nog uit"
from pg_tables
where schemaname = 'public' and rowsecurity = false;
