import { supabase } from "./supabase";

// E-mailverificatie bij registreren. Werkt pas als "Confirm email" in Supabase aan staat
// (Authentication → Sign In / Providers → Email); staat die uit, dan logt registreren direct in.

// Adres waar de link in de bevestigingsmail naartoe gaat: de loginpagina, met de bestemming
// uit de onboarding erbij. Dit adres moet in Supabase bij de Redirect URLs staan.
export function confirmRedirectUrl(next) {
  const url = new URL("/onboarding/login", window.location.origin);
  url.searchParams.set("bevestigd", "1");
  if (next) url.searchParams.set("next", next);
  return url.toString();
}

// Stuurt de bevestigingsmail opnieuw. Geeft een foutmelding terug, of null als het gelukt is.
export async function resendConfirmation(email, next) {
  const { error } = await supabase.auth.resend({
    type: "signup",
    email,
    options: { emailRedirectTo: confirmRedirectUrl(next) },
  });
  return error ? error.message : null;
}

// Herkent de fout van Supabase als iemand inlogt voordat het e-mailadres is bevestigd.
export function isEmailNotConfirmed(error) {
  return error?.code === "email_not_confirmed" || /email not confirmed/i.test(error?.message || "");
}
