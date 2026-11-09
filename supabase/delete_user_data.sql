-- Bewaartermijn: gegevens blijven bewaard zolang het account bestaat (zie de privacyverklaring).
-- Wordt een account verwijderd (Supabase: Authentication > Users > Delete user), dan wist dit script
-- automatisch ook het profiel, de voortgang en de antwoorden van die gebruiker.
--
-- Uitvoeren in Supabase: SQL Editor > New query > dit hele bestand plakken > Run.
-- Het script kan veilig opnieuw worden uitgevoerd.
--
-- LET OP: verwijder een account altijd via Authentication > Users, niet alleen de rij in profiles.
-- Zonder het account in auth.users kan iemand anders gewoon blijven inloggen.

create or replace function public.delete_user_data()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Eerst de gegevens, dan het profiel. "before delete", zodat een verwijzing van
  -- profiles naar auth.users het verwijderen van het account niet blokkeert.
  -- (::text zodat het werkt of user_id nu uuid of text is.)
  delete from public.course_progress where user_id::text = old.id::text;
  delete from public.course_answers where user_id::text = old.id::text;
  delete from public.profiles where id::text = old.id::text;
  return old;
end;
$$;

revoke all on function public.delete_user_data() from public, anon, authenticated;

drop trigger if exists on_auth_user_deleted on auth.users;

create trigger on_auth_user_deleted
  before delete on auth.users
  for each row execute function public.delete_user_data();
