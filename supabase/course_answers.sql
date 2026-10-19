-- Tabel voor de antwoorden die gebruikers in de modules invullen.
-- Eén rij per gebruiker, per module en per vraag. De rij wordt bijgewerkt als het antwoord verandert.
-- Uitvoeren in Supabase: SQL Editor > New query > dit bestand plakken > Run.

create table if not exists public.course_answers (
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  category text not null,       -- bijvoorbeeld "module-1"
  question_id text not null,    -- id uit mensenkennersvragen.json, bijvoorbeeld "m1_q02_matching_gedrag_effect"
  answer jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  primary key (user_id, category, question_id)
);

-- Row Level Security: iedere gebruiker ziet en wijzigt alleen de eigen antwoorden.
alter table public.course_answers enable row level security;

create policy "Eigen antwoorden lezen"
  on public.course_answers for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Eigen antwoorden toevoegen"
  on public.course_answers for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Eigen antwoorden bijwerken"
  on public.course_answers for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Eigen antwoorden verwijderen"
  on public.course_answers for delete
  to authenticated
  using (auth.uid() = user_id);
