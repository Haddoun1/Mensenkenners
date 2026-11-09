// Logt uit bij het adminpaneel: sluit de sessie in Supabase en wist de sessiecookie.
// Wordt aangeroepen door de knop "Uitloggen" in het adminpaneel (formulier) en door
// de uitlogknop op de profielpagina (fetch), zodat uitloggen altijd beide sessies sluit.
import type { APIRoute } from "astro";
import { createSupabaseServerClient } from "../../lib/supabaseServer";

export const prerender = false;

export const POST: APIRoute = async (context) => {
  const supabase = createSupabaseServerClient(context);

  // Trekt de sessie in bij Supabase; dat wist via de cookie-functies ook de cookie.
  await supabase.auth.signOut().catch(() => {});

  // Vangnet: wis alle Supabase-cookies (namen beginnen met "sb-", soms in stukken als .0, .1).
  const cookieHeader = context.request.headers.get("cookie") || "";
  cookieHeader
    .split(";")
    .map((part) => part.split("=")[0].trim())
    .filter((name) => name.startsWith("sb-"))
    .forEach((name) => context.cookies.delete(name, { path: "/" }));

  // Formulier vanuit het adminpaneel: terug naar de admin-login met een melding.
  // Een fetch (vanaf de profielpagina) krijgt alleen een leeg antwoord.
  const isFetch = context.request.headers.get("accept")?.includes("application/json");
  if (isFetch) return new Response(null, { status: 204 });
  return context.redirect("/admin/login?uitgelogd", 303);
};
