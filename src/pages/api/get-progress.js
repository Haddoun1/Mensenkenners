import { supabase } from "../../lib/supabase";

export async function POST({ request }) {
  let body = {};

  try {
    body = await request.json();
  } catch {
    return new Response(
      JSON.stringify({
        data: null,
        error: "Ongeldige JSON"
      }),
      {
        status: 400,
        headers: {
          "Content-Type": "application/json"
        }
      }
    );
  }

  if (!body.userId) {
    return new Response(
      JSON.stringify({
        data: null,
        error: "userId ontbreekt"
      }),
      {
        status: 400,
        headers: {
          "Content-Type": "application/json"
        }
      }
    );
  }

  const { data, error } = await supabase
    .from("course_progress")
    .select("*")
    .eq("user_id", body.userId)
    .order("ended_at", { ascending: false });

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