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

// Slaat de groep die bij het registreren is gekozen op in het profiel, als dat nog niet gebeurd is.
// Zonder groep kan de deelnemer gewoon verder; de hoofdadmin kan later een groep koppelen.
export async function saveSignupGroup(user) {
  const groupFromSignup = user?.user_metadata?.group_id;
  if (!groupFromSignup) return;

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("group_id, role")
    .eq("id", user.id)
    .maybeSingle();

  // Bij een fout niets doen; de volgende keer wordt het opnieuw geprobeerd.
  if (error) return;
  // Admins kiezen niet zelf een groep; die koppelt de hoofdadmin (zie set_my_group in supabase/groups.sql).
  if (profile?.group_id || profile?.role === "admin" || profile?.role === "superadmin") return;

  await supabase.rpc("set_my_group", { new_group: groupFromSignup });
}
