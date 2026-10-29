// Waar de gebruiker na het inloggen (of groep kiezen) heen gaat, uit ?next=.
// Alleen interne paden zijn toegestaan; anders naar het dashboard.
// De browser parset de URL zelf, zodat trucs als "/\evil.com" of "//evil.com" (die de browser als
// andere site leest) ook worden afgevangen: alleen een URL op onze eigen origin telt.
export function safeNextUrl(next) {
  if (!next) return "/";
  try {
    const url = new URL(next, window.location.origin);
    if (url.origin !== window.location.origin) return "/";
    return url.pathname + url.search + url.hash;
  } catch {
    return "/";
  }
}
