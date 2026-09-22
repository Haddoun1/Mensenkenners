# Mensenkenners — E-learning Platform

**Live:** [vlekkeloos-meesterproef.onrender.com](https://vlekkeloos-meesterproef.onrender.com)

Een webapplicatie waarmee medewerkers inclusiviteitstrainingen kunnen volgen. Gebruikers doorlopen een onboarding en vier modules met tekst, video en interactieve vragen. Een admin-dashboard toont de voortgang per deelnemer.

---

## Tech stack

| Laag | Technologie |
|------|-------------|
| Framework | [Astro](https://astro.build) v6 (SSR, Node adapter) |
| Database & Auth | [Supabase](https://supabase.com) |
| Animaties | [GSAP](https://gsap.com) |
| Hosting | Render |
| Font | Plus Jakarta Sans (lokaal, in `public/fonts/`) |

---

## Lokaal opstarten

### 1. Vereisten

- Node.js >= 22.12.0
- Een Supabase-project (zie het [Supabase-hoofdstuk](#database--authenticatie-supabase))

### 2. Omgevingsvariabelen

Maak een `.env`-bestand aan in de root:

```env
PUBLIC_SUPABASE_URL=https://<jouw-project>.supabase.co
PUBLIC_SUPABASE_ANON_KEY=<jouw-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<jouw-service-role-key>
```

Alle drie zijn te vinden in Supabase onder **Project Settings → API**.

### 3. Installeren en starten

```sh
npm install
npm run dev       # start op http://localhost:4321
```

| Commando | Actie |
|----------|-------|
| `npm run dev` | Ontwikkelserver op `localhost:4321` |
| `npm run build` | Bouw productieversie naar `./dist/` |
| `npm run preview` | Preview de gebouwde versie lokaal |

---

## Projectstructuur

```
/
├── public/
│   ├── fonts/              # Plus Jakarta Sans (.woff2)
│   ├── images/             # Afbeeldingen en logo's
│   └── styles/
│       ├── global.css      # CSS-variabelen, dark mode, gedeelde stijlen
│       └── onboarding.css  # Stijlen specifiek voor de onboarding
│
├── src/
│   ├── components/         # Herbruikbare UI-componenten
│   ├── data/
│   │   └── mensenkennersvragen.json  # Alle content voor intro + 4 modules
│   ├── layouts/            # Pagina-layouts
│   ├── lib/                # Supabase-clients
│   ├── pages/              # Alle pagina's en API-routes
│   └── utils/
│       └── slugify.js      # Zet categorie-namen om naar URL-slugs
│
├── astro.config.mjs        # Astro-config (SSR + Node adapter)
└── package.json
```

---

## Onboarding

### Wat is de onboarding?

De onboarding is een korte introductie die nieuwe gebruikers doorlopen voordat ze beginnen met de modules. Het legt uit wat Mensenkenners is en vraagt de gebruiker een account aan te maken of in te loggen.

### Paginavolgorde

```
/onboarding/welkom          → Welkomstscherm met loader
/onboarding/login           → Inloggen
/onboarding/register        → Account aanmaken
/onboarding/step-1 … step-5 → Inhoudelijke onboarding-stappen
/onboarding/result          → Eindscherm van de onboarding
```

Na de onboarding gaat de gebruiker naar het dashboard (`/`).

### Layout-onboarding.astro

Alle onboarding-pagina's gebruiken `src/layouts/Layout-onboarding.astro`. Dit is een tweekoloms-layout: links een afbeelding of illustratie (via `<slot />`), rechts logo, tekst, voortgangsindicator en knoppen.

De layout accepteert de volgende props:

| Prop | Type | Standaard | Omschrijving |
|------|------|-----------|--------------|
| `title` | string | — | Paginatitel (`<title>`) |
| `headingText` | string | `"Welkom!"` | Grote koptekst rechts |
| `bodyText` | string | `"..."` | Beschrijvende tekst rechts |
| `nextHref` | string | `"/"` | URL van de volgende stap |
| `backHref` | string | `"/"` | URL van de vorige stap |
| `step` | number | `1` | Huidige stap (voor voortgangsindicator) |
| `totalSteps` | number | `5` | Totaal aantal stappen |
| `stepId` | string | — | ID voor voortgang opslaan (bijv. `onboarding_step-1`) |
| `category` | string | — | Categorie voor voortgang opslaan (bijv. `onboarding`) |
| `showProgress` | boolean | `true` | Toon/verberg voortgangsindicator |
| `showNext` | boolean | `true` | Toon/verberg "Ga verder"-knop |
| `showBack` | boolean | `true` | Toon/verberg "Ga terug"-knop |
| `showDashboardButton` | boolean | `true` | Toon/verberg "Dashboard"-link bovenaan |
| `mockupSrc` | string | `""` | Afbeelding in het rechterpaneel (op desktop) |
| `variant` | string | `""` | Extra CSS-class op `<main>` (bijv. `"login"`) |

**Voorbeeld — een onboarding-stap:**

```astro
---
import MainLayout from "../../layouts/Layout-onboarding.astro";
---

<MainLayout
  title="Stap 1"
  nextHref="/onboarding/step-2"
  backHref="/onboarding/login"
  headingText="Wat is Mensenkenners?"
  bodyText="Met Mensenkenners trainen we onze inclusiviteitsspier."
  step={1}
  totalSteps={5}
  stepId="onboarding_step-1"
  category="onboarding"
>
  <img src="/images/Mensenkennerskaderdoof.png" alt="Illustratie" />
</MainLayout>
```

Alles binnen de `<MainLayout>`-tags verschijnt in het **linkerpaneel** (de `<slot />`).

### Paginatransities

De onboarding gebruikt Astro's `<ClientRouter />` voor vloeiende animaties tussen stappen. Bij "Ga verder" schuift de nieuwe pagina van rechts in; bij "Ga terug" van links. Dit wordt geregeld via de klasse `is-going-back` op `<html>` en de CSS-animaties in `onboarding.css`.

### Onboarding-stap toevoegen

1. Maak een nieuw bestand aan, bijv. `src/pages/onboarding/step-6.astro`
2. Gebruik de layout hierboven met het juiste `step`-nummer en de juiste `nextHref`/`backHref`
3. Pas in de vorige stap (`step-5.astro`) de `nextHref` aan naar `/onboarding/step-6`

---

## Modules

### Hoe modules werken

Alle content voor de modules staat in één JSON-bestand:

```
src/data/mensenkennersvragen.json
```

Astro leest dit bestand tijdens de build en genereert voor elk blok een statische pagina via `src/pages/[category]/[step].astro`. De URL wordt bepaald door:

- `Category` → URL-prefix (bijv. `"Module 1"` → `/module-1/`)
- Positie in de array → stapnummer (bijv. `/module-1/3`)

Het JSON-bestand bevat een array `blocks`. Elk blok is één pagina met een `type`:

| Type | Omschrijving |
|------|--------------|
| `content` | Tekstpagina (title, subtitle, text, list) |
| `video` | Videopagina (YouTube of Vimeo URL) |
| `question` | Vraagpagina (zie input-types hieronder) |

De volgorde van blokken in de array bepaalt de volgorde van stappen. Een nieuw blok ertussen plakken = dat wordt de nieuwe stap op die plek.

### Nieuwe inhoud toevoegen aan de JSON

#### Tekstpagina

```json
{
  "id": "m1_content_jouw_onderwerp",
  "type": "content",
  "Category": "Module 1",
  "title": "Titel van de pagina",
  "text": "Tekst die op de pagina verschijnt.",
  "list": [
    "Punt één",
    "Punt twee"
  ]
}
```

`text` en `list` zijn beide optioneel — je kunt ze apart of samen gebruiken.

#### Videopagina

```json
{
  "id": "m2_video_jouw_video",
  "type": "video",
  "Category": "Module 2",
  "title": "Titel van de video",
  "url": "https://www.youtube.com/watch?v=XXXXXXXXX"
}
```

YouTube- en Vimeo-links worden automatisch omgezet naar embed-URL's.

#### Enkelvoudige keuzevraag (single_choice)

Eén juist antwoord. Markeer het juiste antwoord met `"is_correct": true`.

```json
{
  "id": "m1_q03_enkelvoudig",
  "type": "question",
  "Category": "Module 1",
  "title": "Paginatitel",
  "question": "Welke aanpak is het meest inclusief?",
  "input_type": "single_choice",
  "explanation": "Uitleg die na het checken verschijnt.",
  "options": [
    { "text": "Direct hulp overnemen." },
    { "text": "Vragen of hulp gewenst is.", "is_correct": true },
    { "text": "Afwachten tot iemand hulp vraagt." }
  ]
}
```

#### Meervoudige keuzevraag (multiple_choice)

Meerdere antwoorden kunnen juist zijn. Met `max_selections` beperk je hoeveel de gebruiker er mag kiezen.

```json
{
  "id": "m2_q05_meervoudig",
  "type": "question",
  "Category": "Module 2",
  "title": "Paginatitel",
  "question": "Welke twee reacties zijn passend?",
  "input_type": "multiple_choice",
  "max_selections": 2,
  "explanation": "Uitleg die na het checken verschijnt.",
  "options": [
    { "text": "Rustig luisteren.", "is_correct": true },
    { "text": "De zin afmaken." },
    { "text": "Geduldig wachten.", "is_correct": true },
    { "text": "Snel antwoord geven." }
  ]
}
```

#### Schaalvraag (rating)

```json
{
  "id": "m3_q02_schaal",
  "type": "question",
  "Category": "Module 3",
  "title": "Paginatitel",
  "question": "Hoe toegankelijk voel jij jouw werkplek?",
  "input_type": "rating",
  "scale": {
    "min": 1,
    "max": 10,
    "min_label": "Helemaal niet toegankelijk",
    "max_label": "Volledig toegankelijk"
  }
}
```

#### Open vraag (long_text)

Geen juist of fout antwoord — na checken verschijnt een voorbeeldantwoord.

```json
{
  "id": "m2_q03_open",
  "type": "question",
  "Category": "Module 2",
  "title": "Paginatitel",
  "question": "Beschrijf een situatie waarbij je iemand bewust ruimte hebt gegeven.",
  "input_type": "long_text",
  "example_answer": "Bijvoorbeeld: Ik wachtte rustig tot iemand klaar was met spreken."
}
```

#### Zin afmaken (sentence_completion)

Werkt hetzelfde als `long_text`, maar is bedoeld voor het afmaken van een zin.

```json
{
  "id": "m3_q01_zin",
  "type": "question",
  "Category": "Module 3",
  "title": "Paginatitel",
  "question": "Als ik zie dat iemand moeite heeft met iets, dan...",
  "input_type": "sentence_completion",
  "example_answer": "...vraag ik eerst of ik kan helpen voordat ik iets doe."
}
```

#### Matchingvraag (matching)

De gebruiker koppelt prompts aan antwoorden via dropdowns. De antwoorden worden automatisch gemixt vanuit alle `answer`-waarden in `pairs`.

```json
{
  "id": "m1_q04_matching",
  "type": "question",
  "Category": "Module 1",
  "title": "Paginatitel",
  "question": "Koppel iedere situatie aan de juiste reactie.",
  "input_type": "matching",
  "pairs": [
    {
      "prompt": "Een bezoeker in een rolstoel vraagt de weg.",
      "answer": "Spreek de persoon zelf aan."
    },
    {
      "prompt": "Een bezoeker stottert.",
      "answer": "Luister rustig en geef de persoon de tijd."
    }
  ]
}
```

---

## Components

### `Header.astro`

De vaste topbalk die op alle dashboardpagina's verschijnt (via `Layout.astro`). Bevat het logo, navigatielinks naar externe sites, een uitlogknop en de `ThemeToggle`.

De uitlogknop roept `supabase.auth.signOut()` aan en stuurt de gebruiker naar `/onboarding/login`.

---

### `Footer.astro`

Eenvoudige footer onderaan de dashboardpagina's.

---

### `BaseHead.astro`

Bevat gedeelde `<head>`-inhoud: charset, viewport, favicon en meta-tags. Wordt gebruikt in alle layouts.

---

### `CourseCard.astro`

De kaart die één cursus weergeeft op het dashboard. Toont afbeelding, titel, beschrijving en een voortgangsbalk.

**Props:**

| Prop | Type | Omschrijving |
|------|------|--------------|
| `title` | string | Naam van de cursus |
| `description` | string | Korte omschrijving |
| `image` | string | Pad naar de afbeelding |
| `progress` | number | Percentage (0–100), wordt na laden overschreven door JS |
| `href` | string | Startpagina van de cursus |
| `color` | string | Achtergrondkleur van de kaart (CSS-waarde of variabele) |

De kaart heeft twee `data`-attributen die door het dashboard-script worden ingevuld:
- `data-progress` — huidig percentage
- `data-status` — `not-started`, `in-progress` of `completed`
- `data-resume-href` — URL om te hervatten (laatste bekende stap)

---

### `BottomNav.astro`

De vaste navigatiebalk onderaan module-pagina's met een "Vorige"- en "Volgende"-knop. Staat vastzittend onderaan het scherm (`position: fixed`).

**Props:**

| Prop | Type | Omschrijving |
|------|------|--------------|
| `previousPage` | string \| null | URL van de vorige stap, of `null` (knop wordt dan disabled) |
| `nextPage` | string \| null | URL van de volgende stap, of `null` |

Als een stap een checkbare vraag heeft, wordt de "Volgende"-knop pas klikbaar nadat de gebruiker op "Check antwoord" heeft geklikt. Dit wordt geregeld via `data-checked` op de knop in `[step].astro`.

---

### `Questionnav.astro`

De hamburgerknop in de module-header die een zijmenu opent met alle stappen van de huidige module. Toont het huidige stapnummer en totaal (bijv. `3/6`).

**Props:**

| Prop | Type | Omschrijving |
|------|------|--------------|
| `category` | string | Modulenaam (bijv. `"Module 1"`) |
| `categorySlug` | string | URL-slug (bijv. `"module-1"`) |
| `categoryItems` | array | Alle blokken van deze module (uit JSON) |
| `currentStep` | number | Huidige stap |
| `totalSteps` | number | Totaal aantal stappen |
| `accentColor` | string | CSS-kleurwaarde voor de knop en het paneel |

Het zijmenu schuift van links in met een overlay op de achtergrond. De actieve stap wordt gemarkeerd.

---

### `Accessibilitysimulator.astro`

Een paneel dat vanuit rechts inschuift en waarmee gebruikers beperkingen kunnen simuleren. Zichtbaar op module-pagina's via de "Menu"-knop rechts in de header.

**Beschikbare simulaties:**

| Simulatie | Wat het doet |
|-----------|--------------|
| Contrast | Verlaagt het contrast van de hele pagina via CSS `filter` |
| Helderheid | Past de helderheid aan via CSS `filter` |
| Wazig zicht | Voegt een `blur`-filter toe aan de pagina |
| Dyslexie | Verwisselt willekeurig letters in woorden op de pagina (licht/matig/zwaar) |
| Trilling | Laat de pagina trillen via een `transform` op `<body>` |
| Cursor vertraging | Verbergt de echte cursor en toont een vertraagde stip, simuleert motorieke beperking |

Alle filters werken met CSS op `document.documentElement.style.filter` of `document.body.style`. Er is een "Reset"-knop om alles terug te zetten.

---

### `ThemeToggle.astro`

Een toggle-knop (zon/maan-icoon) die dark mode in- en uitschakelt. Slaat de voorkeur op in `localStorage` onder de sleutel `theme`. Zet de class `dark-mode` op `<html>`.

---

## Database & authenticatie (Supabase)

Supabase verzorgt twee dingen: **gebruikersauthenticatie** (inloggen, registreren, sessies) en de **database** (voortgang opslaan, rollen beheren).

---

### Twee Supabase-clients

Het project gebruikt twee verschillende clients, afhankelijk van waar de code draait:

#### `src/lib/supabase.js` — browser-client

Wordt gebruikt in `<script>`-blokken die in de browser draaien (inloggen, uitloggen, voortgang ophalen).

```js
import { createClient } from "@supabase/supabase-js";
export const supabase = createClient(url, anonKey);
```

#### `src/lib/supabaseServer.ts` — server-client

Wordt gebruikt in de frontmatter van Astro-pagina's (`---` blokken) en in API-routes op de server. Dit is nodig om de ingelogde gebruiker via cookies te controleren — dat kan de browser-client niet vanuit de server.

```ts
import { createSupabaseServerClient } from "../../lib/supabaseServer";
const supabase = createSupabaseServerClient(Astro);
const { data: { user } } = await supabase.auth.getUser();
```

De server-client leest en schrijft cookies automatisch via Astro's cookie-API.

---

### Authenticatie-flow

#### Registreren (`/onboarding/register`)

```js
await supabase.auth.signUp({
  email,
  password,
  options: { data: { name: "Jan", surname: "Jansen" } }
});
```

Naam en achternaam worden opgeslagen in `user_metadata` en zijn later beschikbaar via `user.user_metadata.name`.

> **Let op:** Supabase heeft standaard e-mailbevestiging aan. Zet dit uit via **Supabase → Authentication → Providers → Email → Confirm email** als je wil dat gebruikers meteen kunnen inloggen.

#### Inloggen (`/onboarding/login`)

```js
await supabase.auth.signInWithPassword({ email, password });
```

Supabase slaat de sessie op als cookie. De gebruiker gaat naar `/onboarding/step-1`.

#### Uitloggen (knop in de header)

```js
await supabase.auth.signOut();
// → doorsturen naar /onboarding/login
```

#### Wachtwoord resetten (twee stappen)

1. Admin stuurt via het admin-dashboard een resetlink — Supabase mailt een link naar `/update-password`
2. Op `/update-password` stelt de gebruiker een nieuw wachtwoord in:

```js
await supabase.auth.updateUser({ password: nieuwWachtwoord });
```

---

### Sessiebeveiliging op pagina's

Beveiligde pagina's controleren op de server of iemand is ingelogd vóór de HTML wordt teruggestuurd:

```ts
// src/pages/admin/index.astro
const supabase = createSupabaseServerClient(Astro);
const { data: { user } } = await supabase.auth.getUser();

if (!user) return Astro.redirect("/admin/login");
```

Dit werkt bewust met de **server-client** — de browser-client kan dit niet op de server doen.

---

### Tabellen

#### `profiles`

Bevat de rol van elke gebruiker. Wordt automatisch gevuld via een database-trigger zodra een nieuw account wordt aangemaakt.

| Kolom | Type | Omschrijving |
|-------|------|--------------|
| `id` | uuid (FK → auth.users) | Gebruikers-ID |
| `email` | text | E-mailadres |
| `role` | text | `'admin'` of `'user'` |

SQL om de tabel en trigger aan te maken bij een nieuw Supabase-project:

```sql
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text,
  role text default 'user'
);

create function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
```

#### `course_progress`

Elke keer dat een gebruiker op "Volgende" klikt, wordt hier een nieuwe rij toegevoegd. Er wordt niet geüpdatet — elk stap-bezoek is een aparte rij.

| Kolom | Type | Omschrijving |
|-------|------|--------------|
| `id` | bigint (PK) | Auto-increment |
| `user_id` | text | Supabase user-ID of `'anonymous'` |
| `email` | text | E-mailadres van de gebruiker |
| `name` | text | Naam uit user_metadata |
| `step_id` | text | ID van de stap (bijv. `m1_q01_matching`) |
| `category` | text | URL-slug van de module (bijv. `module-1`) |
| `current_url` | text | Huidige URL, gebruikt voor hervatten |
| `started_at` | timestamptz | Wanneer de gebruiker de stap opende |
| `ended_at` | timestamptz | Wanneer de gebruiker verder klikte |
| `duration_seconds` | integer | Tijd op de stap in seconden |

Voortgangspercentages worden **in de browser berekend**: unieke `step_id`-waarden ÷ totaal aantal stappen per module.

---

### API-routes

| Route | Methode | Wat het doet |
|-------|---------|--------------|
| `/api/track-step` | POST | Slaat één stap op in `course_progress` |
| `/api/get-progress` | POST | Haalt alle voortgang op voor een `userId` |
| `/api/admin-role` | POST | Geeft of verwijdert adminrechten op basis van e-mail |

De admin-role route gebruikt een **service-role key** die alleen server-side beschikbaar is:

```env
SUPABASE_SERVICE_ROLE_KEY=<jouw-service-role-key>
```

Te vinden in Supabase onder **Project Settings → API → service_role**. Deze key mag nooit in de browser terechtkomen.

---

### Row Level Security (RLS)

Stel de volgende policies in via **Supabase → Table Editor → [tabel] → RLS**:

**`course_progress`**
- `INSERT`: toegestaan voor iedereen (ook anoniem)
- `SELECT`: alleen de eigenaar (`user_id = auth.uid()::text`)

**`profiles`**
- `SELECT`: alleen de eigenaar
- `UPDATE`: alleen de eigenaar

Admin-acties via `/api/admin-role` gebruiken de service-role key en omzeilen RLS bewust.

---

### Nieuw Supabase-project opzetten

1. Maak de tabellen `profiles` en `course_progress` aan
2. Voeg de database-trigger toe voor `profiles` (SQL hierboven)
3. Stel RLS-policies in op beide tabellen
4. Kopieer `PUBLIC_SUPABASE_URL`, `PUBLIC_SUPABASE_ANON_KEY` en `SUPABASE_SERVICE_ROLE_KEY` naar `.env`
5. Zet e-mailbevestiging uit als je dat wil
6. Zet alle drie de variabelen in als environment variables op Render

---

## Admin-dashboard (`/admin`)

Toegankelijk voor accounts met `role = 'admin'` in de `profiles`-tabel. Niet-admins worden doorgestuurd naar `/`.

**Het dashboard toont:**
- Totaalstatistieken: opgeslagen stappen, unieke gebruikers, actieve tijd, actieve cursussen
- Per module: een tabel met alle gebruikers, hun stapcount, tijdsbesteding, laatste stap en laatste activiteit

**Admin-tools onderaan:**
- Wachtwoord-resetlink versturen naar een gebruiker op basis van e-mailadres
- Adminrechten toekennen of intrekken op basis van e-mailadres

**Eerste admin aanmaken:** stel de rol handmatig in via de Supabase-interface onder **Table Editor → profiles → [rij van de gebruiker] → role = admin**.

---

## CSS-variabelen (`public/styles/global.css`)

Alle kleuren, fonts en groottes worden via CSS-variabelen beheerd op het `html`-element. Dark mode overschrijft een deel hiervan via `html.dark-mode {}`.

### Merkkleuren

| Variabele | Waarde (light) | Gebruik |
|-----------|---------------|---------|
| `--color-text` | `#222020` | Standaard tekstkleur |
| `--color-background` | `#ffffff` | Pagina-achtergrond |
| `--color-green` | `#2AB789` | Primaire accentkleur, dashboard-knoppen |
| `--color-cyan` | `#B1F2D9` | Lichte accenttint, knoppen en tags |
| `--color-cyan-dark` | `#8bcab2` | Hover-variant van cyan |
| `--color-pink` | `#FF94E1` | Module 1 |
| `--color-yellow` | `#E9F279` | Module 2 |
| `--color-red` | `#FF6631` | Module 3 |
| `--color-blue` | `#647bef` | Module 4 |

### Module-accentkleuren

Elke module krijgt zijn eigen accentkleur via `--color-accent`. Deze wordt per pagina als inline style op `.page-shell` gezet door `[step].astro`.

```css
--accent-intro:    #B1F2D9   /* Onboarding / Intro */
--accent-module-1: #FF94E1   /* Module 1 */
--accent-module-2: #E9F279   /* Module 2 */
--accent-module-3: #FF6631   /* Module 3 */
--accent-module-4: #647bef   /* Module 4 */
```

De dark mode-varianten staan eronder als `--accent-module-X-dark`. Wil je de kleur van een module aanpassen, verander dan beide waarden.

### Module-UI kleuren

| Variabele | Omschrijving |
|-----------|--------------|
| `--module-card-background` | Achtergrond van de contentkaart |
| `--module-option-label` | Achtergrond van een antwoordoptie |
| `--module-option-label-hover` | Achtergrond bij hover |
| `--module-option-checked` | Achtergrond van een geselecteerde optie |
| `--module-option-checked-letter` | Kleur van de letterbox (A/B/C) bij selectie |
| `--module-text-input` | Achtergrond van tekstvelden en textareas |
| `--module-right-correct` | Feedbackblok bij goed antwoord |
| `--module-wrong-error` | Feedbackblok bij fout antwoord |

### Achtergrondgradiënten

| Variabele | Gebruik |
|-----------|---------|
| `--gradient-bg-cyan` | Standaard pagina-achtergrond |
| `--gradient-bg-pink/yellow/red/blue` | Per module-variant |
| `--gradient-bg-cyan-card` | Kaarten op het dashboard |
| `--gradient-bg-header` | Header-achtergrond |

### Onboarding & overig

| Variabele | Omschrijving |
|-----------|--------------|
| `--onboarding-text` | Tekstkleur in de onboarding |
| `--onboarding-label` | Kleur van labels in formulieren |
| `--onboarding-back-button` | Kleur van de terugknop |
| `--error-login` | Rood voor foutmeldingen bij inloggen |
| `--simulator-background` | Achtergrond van de toegankelijkheidssimulator |
| `--simulator-background-panel` | Achtergrond van het simulatorpaneel |
| `--select-dropdown` | Achtergrond van `<option>`-elementen in dropdowns |

### Fonts

Gebruik altijd de variabele, nooit de font-naam direct.

| Variabele | Gewicht |
|-----------|---------|
| `--font-extra-light` | 200 |
| `--font-light` | 300 |
| `--font-regular` | 400 |
| `--font-medium` | 500 |
| `--font-semi-bold` | 600 |
| `--font-bold` | 700 |
| `--font-extra-bold` | 800 |

Van elk gewicht bestaat ook een italic-variant, bijv. `--font-bold-italic`.

### Type scale

| Variabele | Waarde |
|-----------|--------|
| `--size-xs` | 0.75rem (12px) |
| `--size-sm` | 0.875rem (14px) |
| `--size-base` | 1rem (16px) |
| `--size-lg` | 1.125rem (18px) |
| `--size-xl` | 1.25rem (20px) |
| `--size-2xl` | 1.5rem (24px) |
| `--size-3xl` | 1.875rem (30px) |
| `--size-4xl` | 2.25rem (36px) |

Grotere stappen lopen door t/m `--size-10xl` (10rem).

### Dark mode toevoegen aan nieuwe variabelen

Als je een nieuwe CSS-variabele toevoegt, voeg dan ook een dark mode-waarde toe in het blok `html.dark-mode {}` in `global.css`. Anders blijft die variabele in dark mode de lichte waarde gebruiken.

---

## Deployment

Het project draait als een Node.js server (`output: 'server'` in `astro.config.mjs`).

```sh
npm run build
node ./dist/server/entry.mjs
```

Het project is geconfigureerd voor [Render](https://render.com):

- **Build command:** `npm install && npm run build`
- **Start command:** `node ./dist/server/entry.mjs`
- Voeg de drie Supabase-omgevingsvariabelen toe onder **Environment**:
  - `PUBLIC_SUPABASE_URL`
  - `PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`
