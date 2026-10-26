  // Slaat een bezochte stap op in course_progress.
  // De gebruiker wordt bepaald aan de hand van het meegestuurde toegangstoken (Authorization-header),
  // niet aan de hand van een userId in het verzoek. Zo kan niemand voortgang opslaan voor iemand anders.
  import { getSupabaseForRequest } from "../../lib/supabaseServer";

  const json = (body, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: {
        "Content-Type": "application/json"
      }
    });

  // Deze functie wordt uitgevoerd wanneer een POST-request
  // naar deze API-route wordt gestuurd.
  export async function POST({ request }) {

    // Controleert wie er is ingelogd. Zonder geldige login slaan we niets op.
    const { supabase, user } = await getSupabaseForRequest(request);
    if (!user) {
      return json({ data: null, error: "Niet ingelogd" }, 401);
    }

    // Leeg object waarin later de ontvangen data wordt opgeslagen.
    let body = {};

    try {

      // Leest de inhoud van het verzoek als tekst.
      const text = await request.text();

      // Zet de ontvangen JSON om naar een JavaScript object.
      // Als er geen data is ontvangen, gebruiken we een leeg object.
      body = text ? JSON.parse(text) : {};

    } catch (error) {

      // Als de ontvangen JSON ongeldig is,
      // sturen we een foutmelding terug.
      return json({ data: null, error: "Geen geldige JSON ontvangen" }, 400);
    }

    // Controleert of de verplichte velden aanwezig zijn.
    // Zonder stepId en category kunnen we geen voortgang opslaan.
    if (!body.stepId || !body.category) {
      return json({ data: null, error: "stepId of category ontbreekt" }, 400);
    }

    // Slaat de cursusvoortgang op in de database.
    // Naam en e-mailadres worden bewust niet meer opgeslagen: die zijn voor de voortgang niet nodig.
    const { error } = await supabase
      .from("course_progress")
      .insert({
        user_id: user.id,
        step_id: String(body.stepId),
        category: String(body.category),
        current_url: body.currentUrl || null,
        started_at: body.startedAt || new Date().toISOString(),
        ended_at: body.endedAt || new Date().toISOString(),
        duration_seconds: Math.max(0, Number(body.durationSeconds) || 0),
      });

    // Stuurt het resultaat terug naar de browser.
    return json({ data: null, error: error?.message || null }, error ? 500 : 200);
  }

  // Deze functie wordt uitgevoerd wanneer iemand
  // deze route via een GET-request bezoekt.
  export async function GET() {

    // Geeft een melding terug dat deze API-route
    // alleen bedoeld is voor POST-requests.
    return json({ message: "Deze API werkt alleen met POST requests." });
  }

// Bronnen
//  https://chatgpt.com/c/6a195d63-9e38-83eb-a00b-9b631d2b3a69  In deze chat heb ik ondersteuning gevraagd bij het ontwikkelen van een Astro- en Supabase-applicatie, waaronder authenticatie, adminfunctionaliteiten, cursusvoortgang en databasekoppelingen.
//  https://chatgpt.com/share/6a3295c2-7e6c-83eb-97ee-084f5489fad9 In deze chat heb ik ondersteuning gevraagd bij het ontwikkelen van een webapplicatie met Astro en Supabase, waaronder gebruikersauthenticatie, een admin dashboard, wachtwoordresets, cursusvoortgang, databasekoppelingen, API-routes, dynamische pagina’s en het opslaan en hervatten van cursusvoortgang.
//  https://supabase.com/docs/guides/database/postgres/row-level-security
