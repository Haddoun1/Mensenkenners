import { defineMiddleware } from "astro:middleware";

// Beveiligingsheaders op elke response, ook van het adminpaneel en de API-routes.
// De Content-Security-Policy voor scripts en styles maakt Astro zelf (zie astro.config.mjs);
// frame-ancestors werkt alleen als header, dus die vullen we hier aan.
const securityHeaders: Record<string, string> = {
  "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
};

const FRAME_ANCESTORS = "frame-ancestors 'none'";

export const onRequest = defineMiddleware(async (_context, next) => {
  const response = await next();

  for (const [name, value] of Object.entries(securityHeaders)) {
    response.headers.set(name, value);
  }

  // Niet overschrijven: Astro kan zelf al een CSP-header met script-hashes hebben gezet.
  const csp = response.headers.get("Content-Security-Policy")?.trim().replace(/;+$/, "");
  response.headers.set("Content-Security-Policy", csp ? `${csp}; ${FRAME_ANCESTORS}` : FRAME_ANCESTORS);

  return response;
});
