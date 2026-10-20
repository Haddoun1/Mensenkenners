-- Laat admins de antwoorden van alle deelnemers lezen (voor het adminpaneel, sectie "Wat nemen deelnemers mee?").
-- Gewone gebruikers blijven alleen hun eigen antwoorden zien (zie course_answers.sql).
-- Uitvoeren in Supabase: SQL Editor > New query > dit bestand plakken > Run.

create policy "Admins lezen alle antwoorden"
  on public.course_answers for select
  to authenticated
  using (
    exists (
      select 1
      from public.profiles
      where profiles.id = auth.uid()
        and profiles.role = 'admin'
    )
  );
