-- Lijst voor het adminpaneel: deelnemers die aan het eind van module 4 "Ja, dat mag" kozen bij
-- "Mogen we je benaderen om in een online gesprek feedback te geven op deze training?"
-- (vraag m4_feedback_contact in src/data/mensenkennersvragen.json).
--
-- Alleen de Head-Admins (rol 'superadmin') krijgen deze lijst, met naam en e-mailadres: de deelnemer
-- heeft hier zelf toestemming voor gegeven. Groepsleiders krijgen niets terug.
--
-- Voer dit uit NA supabase/groups.sql (gebruikt is_superadmin()).
-- Uitvoeren in Supabase: SQL Editor > New query > dit hele bestand plakken > Run.
-- Het script kan veilig opnieuw worden uitgevoerd.
--
-- Hoe het antwoord is opgeslagen: answer.values bevat per keuzerondje true/false,
-- in dezelfde volgorde als de opties. values[0] = "Ja, dat mag", values[1] = "Nee, liever niet".

drop function if exists public.feedback_contacts();

create function public.feedback_contacts()
returns table (email text, naam text, groep text, gekozen_op timestamptz)
language sql
stable
security definer
set search_path = public
as $$
  select
    p.email::text,
    (u.raw_user_meta_data ->> 'name')::text,
    g.name::text,
    a.updated_at
  from public.course_answers a
  join public.profiles p on p.id::text = a.user_id::text
  join auth.users u on u.id = a.user_id
  left join public.groups g on g.id = p.group_id
  where public.is_superadmin()
    and a.category = 'module-4'
    and a.question_id = 'm4_feedback_contact'
    and a.answer -> 'values' ->> 0 = 'true'
  order by a.updated_at desc;
$$;

revoke all on function public.feedback_contacts() from public, anon;
grant execute on function public.feedback_contacts() to authenticated;
