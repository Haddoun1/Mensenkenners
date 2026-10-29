import { supabase } from "./supabase";

// Haalt alle groepen op voor een keuzelijst (registreren of groep kiezen).
// Groepsnamen zijn voor iedereen leesbaar, ook zonder in te loggen (zie supabase/groups.sql).
export async function loadGroups() {
  const { data, error } = await supabase.from("groups").select("id, name").order("name");
  return { groups: data || [], error };
}

// Vult een <select> met de groepen. Zonder groepen blijft de lijst leeg en uitgeschakeld.
export function fillGroupSelect(select, groups) {
  select.replaceChildren(new Option("Kies je groep", "", true, true));
  select.options[0].disabled = true;

  for (const group of groups) {
    select.append(new Option(group.name, group.id));
  }

  if (groups.length === 0) {
    select.options[0].textContent = "Er zijn nog geen groepen";
    select.disabled = true;
    select.required = false;
  }
}

// Zorgt dat een ingelogde deelnemer bij een groep hoort.
// - Al een groep (of hoofdadmin): niets doen.
// - Groep gekozen bij registreren: die alsnog opslaan.
// - Anders: naar /groep om er één te kiezen, en daarna door naar `next` (standaard: deze pagina).
// Geeft true terug als de gebruiker door kan.
export async function ensureGroup(user, next = window.location.pathname + window.location.search) {
  if (!user) return true;

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("group_id, role")
    .eq("id", user.id)
    .maybeSingle();

  // Bij een fout de deelnemer niet blokkeren; de volgende keer wordt het opnieuw geprobeerd.
  if (error) return true;
  // Admins kiezen niet zelf een groep; die koppelt de hoofdadmin (zie set_my_group in supabase/groups.sql).
  if (profile?.group_id || profile?.role === "admin" || profile?.role === "superadmin") return true;

  const groupFromSignup = user.user_metadata?.group_id;
  if (groupFromSignup) {
    const { error: rpcError } = await supabase.rpc("set_my_group", { new_group: groupFromSignup });
    if (!rpcError) return true;
  }

  window.location.replace(`/groep?next=${encodeURIComponent(next)}`);
  return false;
}
