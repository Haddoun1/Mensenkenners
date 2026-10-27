// @ts-check
import { defineConfig } from 'astro/config';
import node from '@astrojs/node';
import { loadEnv } from 'vite';

const { PUBLIC_SUPABASE_URL } = loadEnv(process.env.NODE_ENV ?? 'production', process.cwd(), '');

export default defineConfig({
  output: 'server',
  // Oude URL van de welkompagina blijft werken (bv. bladwijzers).
  redirects: {
    '/onboarding/welkom-no-loader': '/onboarding/welkom',
  },
  adapter: node({
    mode: 'standalone',
  }),
  security: {
    checkOrigin: false,
    // Content Security Policy: Astro zet per pagina een <meta> met hashes van alle scripts,
    // dus alleen de scripts van de site zelf mogen draaien (beperkt de schade van XSS).
    // Werkt niet in `astro dev`; testen met `astro build` + `astro preview`.
    csp: {
      directives: [
        "default-src 'self'",
        "img-src 'self' data: blob:",
        "font-src 'self' https://fonts.gstatic.com",
        `connect-src 'self' ${PUBLIC_SUPABASE_URL}`,
        "frame-src https://www.youtube.com https://www.youtube-nocookie.com https://player.vimeo.com",
        "object-src 'none'",
        "base-uri 'self'",
        "form-action 'self'",
      ],
      // Inline style-attributen (zoals style="--color-accent: ...") zijn nodig voor de modulekleuren.
      styleDirective: {
        resources: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      },
    },
  },
});
