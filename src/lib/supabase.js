import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
const supabaseKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseKey);

// Headers voor de eigen API-routes (/api/track-step, /api/get-progress).
// Het toegangstoken laat de server zien wie er is ingelogd; zonder token weigert de server het verzoek.
export async function authHeaders() {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  return {
    "Content-Type": "application/json",
    ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
  };
}

// Bron: https://chatgpt.com/c/6a195d63-9e38-83eb-a00b-9b631d2b3a69