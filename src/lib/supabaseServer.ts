import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";

// Maakt een Supabase client die handelt namens de gebruiker die het verzoek stuurt.
// De browser stuurt het toegangstoken mee in de header "Authorization: Bearer <token>".
// Supabase controleert dat token, dus een gebruiker kan zich niet voordoen als iemand anders,
// en de RLS-regels in de database gelden gewoon voor deze client.
// Geeft { supabase, user } terug, of { supabase: null, user: null } als het token ontbreekt of ongeldig is.
export async function getSupabaseForRequest(request: Request) {
  const token = request.headers.get("Authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) return { supabase: null, user: null };

  const supabase = createClient(
    import.meta.env.PUBLIC_SUPABASE_URL,
    import.meta.env.PUBLIC_SUPABASE_ANON_KEY,
    {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth: { persistSession: false },
    },
  );

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token);

  if (error || !user) return { supabase: null, user: null };
  return { supabase, user };
}

export function createSupabaseServerClient(Astro: any) {
  return createServerClient(
    import.meta.env.PUBLIC_SUPABASE_URL,
    import.meta.env.PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        get(name: string) {
          return Astro.cookies.get(name)?.value;
        },

        // De sessiecookie bevat het access- en refreshtoken:
        // httpOnly zodat scripts (en dus XSS) hem niet kunnen lezen, secure zodat hij alleen via https gaat.
        // De admin leest de sessie alleen op de server, dus httpOnly breekt niets.
        set(name: string, value: string, options: any) {
          Astro.cookies.set(name, value, {
            ...options,
            path: options?.path ?? "/",
            httpOnly: true,
            secure: true,
            sameSite: "lax",
          });
        },

        remove(name: string, options: any) {
          Astro.cookies.delete(name, {
            ...options,
            path: options?.path ?? "/",
          });
        },
      },
    }
  );
}