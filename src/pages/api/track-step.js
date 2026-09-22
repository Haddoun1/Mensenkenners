  // Importeert de Supabase client.
  // Hiermee kunnen we gegevens opslaan in de database.
  import { supabase } from "../../lib/supabase";

  // Deze functie wordt uitgevoerd wanneer een POST-request
  // naar deze API-route wordt gestuurd.
  export async function POST({ request }) {

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
      return new Response(
        JSON.stringify({
          data: null,
          error: "Geen geldige JSON ontvangen"
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json"
          }
        }
      );
    }

    // Controleert of de verplichte velden aanwezig zijn.
    // Zonder stepId en category kunnen we geen voortgang opslaan.
    if (!body.stepId || !body.category) {
      return new Response(
        JSON.stringify({
          data: null,
          error: "stepId of category ontbreekt"
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json"
          }
        }
      );
    }

    // Slaat de cursusvoortgang op in de database.
    const { data, error } = await supabase
      .from("course_progress")

.insert({
  user_id: body.userId || "anonymous",
  email: body.email || null,
  name: body.name || null,
  step_id: body.stepId,
  category: body.category,
  current_url: body.currentUrl || null,
  started_at: body.startedAt || new Date().toISOString(),
  ended_at: body.endedAt || new Date().toISOString(),
  duration_seconds: body.durationSeconds || 0,
})

      // Geeft het nieuw opgeslagen record direct terug.
      .select();

    // Stuurt het resultaat terug naar de browser.
    return new Response(
      JSON.stringify({
        data,
        error
      }),
      {
        headers: {
          "Content-Type": "application/json"
        }
      }
    );
  }

  // Deze functie wordt uitgevoerd wanneer iemand
  // deze route via een GET-request bezoekt.
  export async function GET() {

    // Geeft een melding terug dat deze API-route
    // alleen bedoeld is voor POST-requests.
    return new Response(
      JSON.stringify({
        message: "Deze API werkt alleen met POST requests."
      }),
      {
        headers: {
          "Content-Type": "application/json"
        }
      }
    );
  }

// Bronnen
//  https://chatgpt.com/c/6a195d63-9e38-83eb-a00b-9b631d2b3a69  In deze chat heb ik ondersteuning gevraagd bij het ontwikkelen van een Astro- en Supabase-applicatie, waaronder authenticatie, adminfunctionaliteiten, cursusvoortgang en databasekoppelingen.
//  https://chatgpt.com/share/6a3295c2-7e6c-83eb-97ee-084f5489fad9 In deze chat heb ik ondersteuning gevraagd bij het ontwikkelen van een webapplicatie met Astro en Supabase, waaronder gebruikersauthenticatie, een admin dashboard, wachtwoordresets, cursusvoortgang, databasekoppelingen, API-routes, dynamische pagina’s en het opslaan en hervatten van cursusvoortgang.