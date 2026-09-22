// Importeert de Supabase client.
// Hiermee kunnen we gegevens toevoegen aan de database.
import { supabase } from "../../lib/supabase";

// Deze functie wordt uitgevoerd wanneer deze API-route
// via een GET-request wordt bezocht.
export async function GET() {

  // Voegt een testrecord toe aan de course_progress tabel.
  // Dit werd gebruikt om te controleren of de databaseverbinding werkt.
  const { data, error } = await supabase
    .from("course_progress")
    .insert({
      // Unieke gebruiker waarvoor de test wordt opgeslagen.
      user_id: "test-user",

      // Test e-mailadres.
      email: "test@example.com",

      // Test naam.
      name: "Test Gebruiker",

      // ID van de stap die zogenaamd is voltooid.
      step_id: "intro_01",

      // Naam van de cursuscategorie.
      category: "Intro",

      // Tijdstip waarop de stap gestart werd.
      started_at: new Date().toISOString(),

      // Tijdstip waarop de stap beëindigd werd.
      ended_at: new Date().toISOString(),

      // Tijd die de gebruiker op deze stap heeft doorgebracht.
      duration_seconds: 10,

      // Geeft aan dat de stap succesvol is afgerond.
      completed: true
    })

    // Geeft het nieuw aangemaakte record direct terug.
    .select();

  // Stuurt het resultaat terug als JSON.
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

// Bronnen
//  https://chatgpt.com/c/6a195d63-9e38-83eb-a00b-9b631d2b3a69  In deze chat heb ik ondersteuning gevraagd bij het ontwikkelen van een Astro- en Supabase-applicatie, waaronder authenticatie, adminfunctionaliteiten, cursusvoortgang en databasekoppelingen.
//  https://chatgpt.com/share/6a3295c2-7e6c-83eb-97ee-084f5489fad9 In deze chat heb ik ondersteuning gevraagd bij het ontwikkelen van een webapplicatie met Astro en Supabase, waaronder gebruikersauthenticatie, een admin dashboard, wachtwoordresets, cursusvoortgang, databasekoppelingen, API-routes, dynamische pagina’s en het opslaan en hervatten van cursusvoortgang.