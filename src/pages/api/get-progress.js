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

  // Bij "Start deze cursus opnieuw" wordt een rij met step_id "reset" opgeslagen.
  // Alleen stappen ná de laatste reset van een cursus tellen mee voor de voortgang.
  // De oude rijen blijven bestaan, zodat het adminpaneel de historie houdt.
  const rowTime = (row) => new Date(row.ended_at || row.created_at || 0).getTime();

  const lastResetByCategory = {};
  (data || []).forEach((row) => {
    if (row.step_id !== "reset") return;
    lastResetByCategory[row.category] = Math.max(lastResetByCategory[row.category] || 0, rowTime(row));
  });

  const activeRows = (data || []).filter(
    (row) =>
      row.step_id !== "reset" &&
      rowTime(row) > (lastResetByCategory[row.category] || 0),
  );

  return new Response(
    JSON.stringify({
      data: activeRows,
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