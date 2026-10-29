// Importeert het type voor een Astro API-route.
// Hierdoor weet TypeScript dat dit bestand een API-endpoint bevat.
import type { APIRoute } from "astro";

// Importeert een gewone Supabase client.
// Deze gebruiken we later met de Service Role Key.
import { createClient } from "@supabase/supabase-js";

// Importeert de server-side Supabase client.
// Hiermee kunnen we controleren welke gebruiker momenteel is ingelogd.
import { createSupabaseServerClient } from "../../lib/supabaseServer";

// Kort hulpje om een JSON-antwoord met een melding terug te sturen.
const reply = (message: string, status: number) =>
    new Response(JSON.stringify({ message }), { status });

// Deze functie wordt uitgevoerd wanneer een POST-request
// naar /api/admin-role wordt gestuurd.
//
// Acties:
// - "add"    gebruiker admin maken (er kan meteen een groep worden meegegeven);
// - "remove" adminrechten weghalen;
// - "group"  alleen hoofdadmin: de groep van een gebruiker instellen.
//
// Deelnemers kunnen hun groep zelf niet wijzigen (alleen eenmalig kiezen); dat gaat via deze route.
//
// Regels:
// - een gewone admin mag alleen gebruikers uit de eigen groep admin maken of adminrechten afnemen,
//   en kan geen groepen wijzigen;
// - een hoofdadmin (superadmin) mag iedereen aanpassen, behalve een andere hoofdadmin;
// - hoofdadmins zelf worden alleen in de database aangewezen (zie supabase/groups.sql).
export const POST: APIRoute = async (context) => {

    // Maakt een server-side Supabase client aan.
    const supabase = createSupabaseServerClient(context);

    // Haalt de momenteel ingelogde gebruiker op.
    const {
        data: { user },
    } = await supabase.auth.getUser();

    // Als niemand is ingelogd stoppen we direct.
    if (!user) return reply("Niet ingelogd", 401);

    // Maakt een admin-client aan met de Service Role Key.
    // Deze heeft meer rechten dan een gewone gebruiker
    // en mag gegevens van andere gebruikers aanpassen.
    const adminClient = createClient(
        import.meta.env.PUBLIC_SUPABASE_URL,
        import.meta.env.SUPABASE_SERVICE_ROLE_KEY,
        {
            auth: {
                // Voorkomt dat deze client sessies opslaat.
                persistSession: false,
            },
        }
    );

    // Controleert welke rol en groep de huidige gebruiker heeft.
    const { data: currentProfile } = await adminClient
        .from("profiles")
        .select("role, group_id")
        .eq("id", user.id)
        .single();

    const isSuperadmin = currentProfile?.role === "superadmin";

    // Alleen admins en hoofdadmins mogen rollen aanpassen.
    if (!isSuperadmin && currentProfile?.role !== "admin") {
        return reply("Geen admin rechten", 403);
    }

    // Leest de verstuurde JSON uit het verzoek.
    const { email, action, groupId } = await context.request.json();

    // Controleert of een geldig e-mailadres en actie zijn meegestuurd.
    if (!email || !["add", "remove", "group"].includes(action)) {
        return reply("Ongeldige input", 400);
    }

    // Groepen wijzigen mag alleen de hoofdadmin. Anders kan een admin zichzelf, of een eigen
    // tweede account, in een andere groep zetten en zo de gegevens van die groep zien.
    if ((action === "group" || groupId) && !isSuperadmin) {
        return reply("Alleen de hoofdadmin kan groepen wijzigen.", 403);
    }

    // Voor een groepswijziging moet een groep gekozen zijn.
    if (action === "group" && !groupId) return reply("Kies een groep", 400);

    // Zoekt het profiel van de gebruiker op basis van e-mailadres.
    const { data: targetProfile, error: findError } = await adminClient
        .from("profiles")
        .select("id, email, role, group_id")
        .eq("email", email)
        .single();

    // Als het profiel niet bestaat geven we een foutmelding terug.
    if (findError || !targetProfile) return reply("Gebruiker niet gevonden", 404);

    // Een hoofdadmin kan via het adminpaneel niet worden aangepast.
    if (targetProfile.role === "superadmin") {
        return reply("Een hoofdadmin kan alleen in de database worden aangepast.", 403);
    }

    // Een gewone admin mag alleen gebruikers uit de eigen groep aanpassen.
    if (!isSuperadmin && (!currentProfile?.group_id || targetProfile.group_id !== currentProfile.group_id)) {
        return reply("Deze gebruiker zit niet in jouw groep.", 403);
    }


    // Bepaalt wat er in het profiel verandert.
    const changes: { role?: string; group_id?: string } = {};
    if (action === "add") changes.role = "admin";
    if (action === "remove") changes.role = "user";
    if (groupId) changes.group_id = groupId;

    // Controleert of de meegestuurde groep bestaat.
    let groupName = "";
    if (changes.group_id) {
        const { data: group } = await adminClient
            .from("groups")
            .select("name")
            .eq("id", changes.group_id)
            .single();

        if (!group) return reply("Groep niet gevonden", 404);
        groupName = group.name;
    }

    // Past het profiel van de gebruiker aan in de database.
    const { error: updateError } = await adminClient
        .from("profiles")
        .update(changes)
        .eq("id", targetProfile.id);

    // Als het updaten mislukt geven we de fout terug.
    if (updateError) return reply(updateError.message, 500);

    // Geeft een succesmelding terug naar de browser.
    const inGroup = groupName ? ` (groep: ${groupName})` : "";
    const messages = {
        add: `${email} is nu admin${inGroup}.`,
        remove: `${email} is geen admin meer.`,
        group: `${email} zit nu in groep ${groupName}.`,
    };

    return reply(messages[action as keyof typeof messages], 200);
};
