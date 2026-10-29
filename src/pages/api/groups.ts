import type { APIRoute } from "astro";
import { createSupabaseServerClient } from "../../lib/supabaseServer";

// Groepen beheren vanuit het adminpaneel (alleen de hoofdadmin).
// Gebruikt de sessie van de ingelogde admin, dus de RLS-regels uit supabase/groups.sql bepalen
// wie mag schrijven: alleen een superadmin. Er is hier geen service role key nodig.
//
// POST   { name }  groep toevoegen
// DELETE { id }    groep verwijderen (deelnemers in die groep krijgen geen groep en kiezen opnieuw)

const reply = (message: string, status: number) =>
  new Response(JSON.stringify({ message }), { status });

async function getSuperadminClient(context: Parameters<APIRoute>[0]) {
  const supabase = createSupabaseServerClient(context);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { supabase: null, error: reply("Niet ingelogd", 401) };

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "superadmin") {
    return { supabase: null, error: reply("Alleen de hoofdadmin kan groepen beheren", 403) };
  }

  return { supabase, error: null };
}

export const POST: APIRoute = async (context) => {
  const { supabase, error } = await getSuperadminClient(context);
  if (!supabase) return error;

  const { name } = await context.request.json();
  const groupName = String(name ?? "").trim();
  if (!groupName || groupName.length > 100) return reply("Vul een groepsnaam in (maximaal 100 tekens)", 400);

  const { error: insertError } = await supabase.from("groups").insert({ name: groupName });
  if (insertError) {
    return reply(insertError.code === "23505" ? "Deze groep bestaat al" : insertError.message, 400);
  }

  return reply(`Groep "${groupName}" toegevoegd.`, 200);
};

export const DELETE: APIRoute = async (context) => {
  const { supabase, error } = await getSuperadminClient(context);
  if (!supabase) return error;

  const { id } = await context.request.json();
  if (!id) return reply("Ongeldige input", 400);

  const { data: deleted, error: deleteError } = await supabase.from("groups").delete().eq("id", id).select("name");
  if (deleteError) return reply(deleteError.message, 400);
  if (!deleted?.length) return reply("Groep niet gevonden", 404);

  return reply(`Groep "${deleted[0].name}" verwijderd.`, 200);
};
