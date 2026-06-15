# CLAUDE.md — Augusto's Research Website

This file documents the architecture, data schemas, and build process for this static research website.
**`README.md` and `LICENSE.md` are managed separately and must never be edited by tooling or Claude.**

---

## Overview

Static site built with **Astro** (zero client JS by default). No CMS, no bespoke build script.

- **Data**: YAML files under `data/` define all content (publications, talks, projects, profile, …).
- **Teaching content**: Markdown/MDX files under `src/content/teaching/` (one file per session).
- **Pages/components**: `.astro` files under `src/pages/`, `src/components/`, `src/layouts/`.
- **Build**: `astro build` renders everything to `dist/` (gitignored). CI rebuilds on every push to `main`.
- **Languages**: English (`/`), Spanish (`/es/`), Italian (`/it/`) — UI strings in `data/i18n/`, content fields use `_es` / `_it` suffixes.
- **Teaching PDFs**: hosted in a **separate GitHub repository** (see `TEACHING_REPO` in `src/config.js`); each session links/embeds its PDF, plus a live folder listing via the GitHub Contents API.

---

## Quick start

```sh
npm install          # first time only
npm run dev          # dev server with hot reload at http://localhost:4321
npm run build        # generate dist/
npm run preview      # serve the production build locally
```

Or combine build + preview (Windows): `scripts/deploy.ps1 -Serve` — serves at http://localhost:8080

---

## Directory layout

```
astro.config.mjs            # Astro config: site URL, trailingSlash, MDX, Shiki theme
tsconfig.json               # editor/tooling support (astro/tsconfigs/base)
data/
  profile.yaml              # bio, photo, social links, organisations, interests, CV
  education.yaml            # degrees (list)
  experience.yaml           # work history (list)
  awards.yaml               # awards & certifications (list)
  languages.yaml            # language proficiency (list)
  coauthors/<key>.yaml      # one file per co-author (name + URL + optional avatar)
  publications/<ID>/
    <ID>.yaml               # publication metadata (type, authors, date, links, tags…)
    <ID>.bib                # BibTeX (parsed for venue/doi; served at /cite/<ID>.bib)
  i18n/{en,es,it}.yaml      # UI strings — same keys, same order, in all three files
  talks/<ID>.yaml           # one file per talk/event
  projects/<ID>.yaml        # one file per funded project
  teaching/
    subjects/<ID>.yaml      # subject METADATA only (title/title_es/title_it, order, hidden)
    tfgs/<ID>.yaml          # one file per Final Degree Project
    tfms/<ID>.yaml          # one file per Master Degree Project
src/
  config.js                 # TEACHING_UNDER_CONSTRUCTION flag + TEACHING_REPO settings
  content.config.ts         # `teaching` content collection (MDX) schema
  content/teaching/         # session content: <subject-id>/<theory|labs|seminars>/NN-slug.mdx
  integrations/
    cite-bib.mjs            # emits /cite/<ID>.bib into dist/ + serves them on the dev server
  lib/
    i18n.js                 # LANGS, loadI18n, localize(), langStaticPaths, langLinks, date fmt
    data.js                 # cached YAML loaders (BOM-tolerant) for everything under data/
    viewmodels.js           # barrel re-exporting all view-model builders (stable import path)
    viewmodels/
      shared.js             # byDateDesc, date formatting, author-chip HTML
      publications.js       # publication cards/overlay + homepage globe pins
      talks.js              # talk cards
      experience.js         # education, work history, awards
      projects.js           # funded-project timeline
      theses.js             # TFG/TFM lists + filter facets
    richtext.js             # mini-markdown for YAML fields ([link](url), _em_, "- " bullets)
    bibtex.js               # minimal BibTeX parser (venue, doi, LaTeX accents)
    icons.js                # loadIcon(name) — inline SVG from public/img/icons
    teaching.js             # teaching-collection helpers (sessions grouped by type)
  layouts/
    BaseLayout.astro        # <head> (SEO/hreflang/fonts/theme FOUC guard), Header, Footer,
                            # global CSS import, client script entry
  components/
    Header.astro            # sticky nav, lang switcher, theme toggle
    Footer.astro            # social icons, copyright
    PageHeader.astro        # page-level header: eyebrow + h1 + optional description
    SectionHead.astro       # section heading: optional eyebrow + h2 + optional action button
    SocialLinks.astro       # social icon row from profile.yaml (hero + footer)
    LinkButtonRow.astro     # row of small icon buttons ({url,label,icon_svg} array)
    AuthorAvatar.astro      # circular avatar (photo or initials) for one author
    AuthorChip.astro        # avatar + name chip ({name,url,avatar_path,initials,bold})
    AuthorList.astro        # comma-separated AuthorChip list
    FilterBar.astro         # shared faceted-filter panel/sidebar (publications + TFG/TFM lists)
    PubBadges.astro         # classification chips (identifier/Core/quartile/arXiv)
    PubCardHead.astro       # shared card head: title + badges + authors + venue line
    PubCard.astro           # full publication card (publications page)
    PubCardLink.astro       # linked homepage card (excerpt/tags flags for featured vs latest)
    PubDetailTemplate.astro # inert <template> cloned into the detail <dialog> by JS
    TalkCard.astro          # talk/event card
    ThesisSection.astro     # TFG/TFM filtered list (shared by both sections)
    TimelineItem.astro      # education/work timeline entry (org slot + body slot)
    ProjectTimelineItem.astro # funded-project timeline entry (marker + <details> card)
    Exercise.astro          # exercise callout used inside teaching MDX
    PdfViewer.astro         # lazy PDF <iframe> + download link (teaching sessions)
    GithubPdfList.astro     # live PDF listing from the external teaching repo
  pages/
    [...lang]/index.astro                       # homepage (undefined → /, 'es', 'it')
    [...lang]/publications/index.astro
    [...lang]/talks/index.astro
    [...lang]/projects/index.astro
    [...lang]/experience/index.astro
    [...lang]/teaching/index.astro
    [...lang]/teaching/[subject]/index.astro    # subject page (tabs, MDX, PDFs)
    sitemap.xml.js                              # sitemap endpoint (same URL set as before)
  styles/                   # CSS partials imported by styles/main.css (bundled by Vite)
    main.css  core/  layout/  home/  research/  experience/  projects/  talks/  teaching/
  scripts/                  # client JS, bundled by Astro from BaseLayout's <script>
    main.js                 # entry; inits controllers; dynamic-imports globe.js on homepage
    controller.js  model.js  view.js  globe.js
public/                     # copied verbatim to dist/ — root-absolute URLs (/img/…, /files/…)
  img/  files/  robots.txt
scripts/
  deploy.ps1  deploy.sh     # npm install + build + optional preview
dist/                       # GENERATED — gitignored, do not edit manually
```

---

## Build & performance notes

- **CSS**: `src/styles/main.css` is imported once in `BaseLayout.astro`; Vite resolves the whole `@import` chain into a single hashed stylesheet — no `@import` waterfall.
- **Zero JS by default**: only `src/scripts/main.js` (theme/nav/filters/detail overlay, a few KB) ships on every page. `globe.js` is code-split into its own chunk and dynamically imported **only on the homepage**; inside it, the heavy Globe.gl CDN (~700 KB) is further deferred via `IntersectionObserver`.
- **Code highlighting**: fenced code blocks in teaching MDX are highlighted at **build time** by Astro's built-in Shiki with **dual themes** (`github-light`/`github-dark`, `defaultColor: false` in `astro.config.mjs`); `subject.css` switches the emitted `--shiki-*` variables with the active site theme — no Highlight.js, no client JS.
- **Fonts**: non-blocking `media="print"` swap trick in `BaseLayout.astro`.
- **FOUC prevention**: an inline `<script is:inline>` first in `<head>` applies the stored theme before CSS parses. **Never remove `is:inline`** — Astro would bundle/defer it and the flash returns.
- **Trailing slashes**: `trailingSlash: 'always'` + directory output format keep the exact old URL scheme (`/publications/`, `/es/teaching/<id>/`, …).
- **compressHTML: true** in `astro.config.mjs` keeps classic whitespace collapsing — Astro 7's `'jsx'` default would strip the space between adjacent inline elements (icon + label buttons). Do not remove.
- **BibTeX URLs**: `/cite/<ID>.bib` files are written by the `cite-bib` integration (`src/integrations/cite-bib.mjs`), not by a page route — since Astro 6, dynamic endpoints with a file extension are incompatible with `trailingSlash: 'always'`.

---

## Design system

CSS partials live under `src/styles/` (grouped by area) and are all imported by `src/styles/main.css`. The look is a **refined professional** evolution of the GIIS navy identity: hairline borders, a 3-level soft-shadow elevation system, restrained radii, fluid type. Design tokens live in `src/styles/core/tokens.css`:

```css
:root {
  /* GIIS navy palette (dark default; full light palette in the
     prefers-color-scheme block AND [data-theme="light"] — keep both in sync) */
  --color-bg / --color-bg-alt / --color-surface / --color-surface-2
  --color-text / --color-text-muted
  --color-accent / --color-accent-soft / --color-accent-2 / --color-accent-2-soft
  --color-border (hairlines) / --color-border-strong (interactive)
  /* + --badge-core-* / --badge-quartile-* / --badge-arxiv-* palettes */

  /* Spacing: --space-1..8 (0.25 → 4 rem, 4px base) */
  /* Fluid type: --step--1..4 (clamp() scale ~1.22 ratio; h1=step-4 … h4=step-1) */
  /* Radii: --radius-lg 0.875rem · md 0.625rem · sm 0.375rem · pill */
  /* Borders: --border-w 1px */
  /* Elevation: --shadow-1/2/3 — soft layered shadows (black-based in dark,
     ink-based in light; resting card = shadow-1, hover = shadow-2, dialog = shadow-3) */
  /* Motion: --ease-out, --dur-1 150ms · --dur-2 250ms · --dur-3 400ms */
  /* Z-index: --z-header 50 · --z-skip 100 */
  /* Globe: --globe-ocean/country/stroke/pin — read by globe.js at runtime */
  --font-display / --font-body: 'Titillium Web', system-ui, sans-serif;
  /* Titillium Web has no 500/800 weights — use 400/600/700 (900 for display) */
  --container-width: 1140px;  --header-height: 4.5rem;
}
```

Rules of thumb: borders are `var(--border-w) solid var(--color-border)` (never hardcode widths), shadows come only from `--shadow-1/2/3`, durations/easings only from the motion tokens. To retune colours or fonts, edit tokens and run `npm run dev` / `npm run build`.

---

## Motion & view transitions

Defined in `src/styles/core/animations.css` + `transitions.css`; scroll-reveal JS in `src/scripts/controller.js`.

- **Hover/reveal contract**: interactive hover lifts animate the `translate` property (`translate: 0 -1px/-2px` + one elevation step up); entrance/reveal animations animate `transform`. The two compose on the compositor — never set `translate` in a reveal rule or it kills the hover lift.
- **Scroll reveal** (homepage only): IntersectionObserver-driven, **fires once** per element (`.reveal`/`.reveal--card` + `.is-visible`); cards in the same grid stagger by 0.08 s via `--reveal-delay`. Elements already in the viewport on load appear instantly.
- **Hero entrance**: CSS-only staggered `rise-in` keyframes on `.hero-content` children + photo (`animation … backwards`), no JS — safe above the fold.
- **Header scroll state**: `initHeaderScroll()` (rAF-guarded) toggles `.site-header.is-scrolled` → hairline + `--shadow-1` + stronger blur.
- **Cross-document view transitions**: pure CSS `@view-transition { navigation: auto }` (200/250 ms crossfade) in `transitions.css`; the header has `view-transition-name: site-header` so the chrome stays stable. Progressive enhancement, zero JS — do **not** add Astro's `<ClientRouter/>`.
- Everything is gated behind `prefers-reduced-motion: no-preference` (reveals, hero, view transitions, globe rotation/entrance).

---

## Content data model

### Profile — `data/profile.yaml`

| Field | Description |
|---|---|
| `name` | Full name — used in page titles and the footer |
| `role` | Short job title — shown in hero |
| `tagline` | Shown below name in hero (`tagline_es`, `tagline_it` for translations) |
| `bio` | Multi-paragraph bio (`bio_es`, `bio_it`). Supports `[text](url)`, `_emphasis_`, `- ` list lines |
| `email`, `cv` | Used for CTA buttons in the hero |
| `photo` | Path under `public/` (e.g. `img/profile.jpg`) |
| `site_url` | Base URL — used for canonical/og tags and the sitemap |
| `organizations` | List of `{name, url}` — rendered as linked text in the hero |
| `interests` | List of strings — rendered as pill tags |
| `social` | List of `{icon, url, label}` — valid icons: `mail github linkedin x scholar orcid researchgate dblp` |
| `site_title` | Short name used as `aria-label` on the nav logo link |

### Education — `data/education.yaml`

```yaml
- area: "PhD in Computer Science"
  institution: "University of Oviedo"
  date_start: 2020-01-01
  date_end: 2024-01-01       # blank = ongoing
  summary: >-
    Thesis: Title. [PDF](https://example.com)
  button:
    text: "View Thesis"
    url:  "https://example.com"
```

### Work experience — `data/experience.yaml`

```yaml
- position: "Assistant Professor"
  position_es: "Profesor Ayudante Doctor"
  company_name: "University of Oviedo"
  company_url:  "https://www.uniovi.es"
  company_logo: "img/org/uniovi.svg"    # path under public/; optional (legacy single logo)
  company_logos:                         # optional array — takes priority over company_logo
    - "img/org/uniovi.svg"
  location:     "Dept. of Computer Science"
  date_start: 2024-09-01
  date_end:   ""                         # empty = "Present"
  collaborator: bertolino                # optional key from data/coauthors/
  degrees:                               # optional — chip array rendered below position
    - name: "MSc Computer Science"
      name_es: "Máster en Ingeniería Informática"
      logo: "img/org/uniovi.svg"
  subjects:                              # optional — structured list rendered as bullets
    - name: "Software Testing"
      name_es: "Pruebas de Software"
  summary: >-                            # supports [url], _em_, "- " bullets
    - Teaching responsibility 1.
  summary_es: >-
    - Responsabilidad docente 1.
```

### Awards — `data/awards.yaml`

```yaml
- title: "AWS Certified Solutions Architect"
  url:     "https://example.com/credential"
  date:    2024-06-01
  awarder: "Amazon Web Services"
  icon:    "img/org/aws.svg"
  summary: "Short description."
```

### Languages — `data/languages.yaml`

```yaml
- name: "Spanish"
  percent: 100
```

### Co-authors — `data/coauthors/<key>.yaml`

```yaml
name: "Antonia Bertolino"
url:  "https://orcid.org/0000-0001-7571-5459"
avatar: "img/coauthors/bertolino.jpg"   # optional — circular chip avatar
```

The key `augusto` → bold **Cristian Augusto** (no link); must never be removed.

### Publications — `data/publications/<ID>/<ID>.yaml` + `<ID>.bib`

```yaml
type: conference          # "conference" or "journal"
authors:
  - augusto               # bold name, no link
  - moranjesus            # resolved from data/coauthors/
  - "Leticia Morales"     # plain string
date: 2026-09-15
venue_short: "CONF26 (C9)"  # identifier like (C9) extracted automatically for ID chip
quartile: "Q1"              # journals only — filter + quartile chip
core: "A*"                  # conferences only — Core rank chip (A*, A, B, C)
location: "City, Country"
title: >-
  Full Paper Title
abstract: >-
  Abstract text. (abstract_es, abstract_it for translations)
tags:
  - Software Testing
featured: false
links:
  pdf:     "https://..."
  slides:  "https://..."
  arxiv:   "https://arxiv.org/abs/..."   # shows arXiv chip + button
  code:    "https://..."
  dataset: "https://..."
  poster:  "https://..."
projects:
  - equavel               # reference to data/projects/<id>.yaml
lat: 37.5665              # optional — shows pin on homepage globe
lng: 126.9780
```

**Classification chips** (upper-right of each card): identifier extracted from `venue_short` via regex `/(CX|JX)/`, `Core <rank>` from `core:`, quartile from `quartile:`, clickable `arXiv` chip when `links.arxiv` is set.

**Link buttons** are auto-generated from `links:`; DOI and BibTeX buttons are added automatically from the `.bib` file. Publication view models are built in `src/lib/viewmodels.js` (`buildPublicationViewModels`).

**Detail overlay**: clicking a pub card opens a `<dialog>` with the full abstract, project logo cards, and top-3 related publications by shared-tag overlap. `/publications/#<id>` deep links auto-open the overlay (handled by `src/scripts/controller.js`).

### Talks — `data/talks/<ID>.yaml`

```yaml
title: "Talk Title Here"
event_url: "https://conference.org/2026"
location: "City, Country"
summary: "Full event name — CONFX 2026."
abstract: >-
  What the talk was about.
date_start: 2026-09-10
date_end:   2026-09-12
image: "img/talks/<id>.jpg"
links:
  - label: "Slides"
    url: "https://..."
```

### Projects — `data/projects/<ID>.yaml`

```yaml
title: "PROJECT ACRONYM"
full_title: "Full descriptive title"
summary: "PID2026-123456XY"      # short pill tag (grant code, etc.)
status: open                      # "open" → Ongoing; any other → Completed
date_start: 2026-01-01
date_end:   2028-12-31
image: "img/projects/<id>.png"
funding_body: "Ministry of Science"
amount: "100,000.00€"             # optional
partners: "University of Oviedo"
researchers: "PhD. Jane Doe"
role: "Work Team Member"          # optional
```

---

## Homepage globe

The homepage shows a 3D globe (Globe.gl + topojson, CDN-loaded) between the about section and the featured publications. The globe driver element is `350vh` tall with `position: sticky`; scroll position directly controls camera longitude (one full 360° rotation).

- **Pins** appear when the globe rotates toward a conference location; margin labels with SVG connectors avoid overlap; clicking navigates to `/publications/#<id>`.
- **Theme**: colours are read from the CSS design tokens (`--globe-*` in `tokens.css`) at init and re-read when `data-theme` changes (`MutationObserver`) or the system scheme flips — the globe can never drift from the site palette.
- Data comes from publications with `lat:`/`lng:` fields (`buildMapLocations` in `src/lib/viewmodels.js`), serialized as `window.GLOBE_LOCATIONS` on the homepage.
- `src/scripts/globe.js` loads only on the homepage (dynamic import in `main.js`, guarded by `#globe-viz`).

---

## Internationalisation (i18n)

Three languages: English (`/`), Spanish (`/es/`), Italian (`/it/`). No i18n library — routing uses the `src/pages/[...lang]/` rest parameter: `getStaticPaths()` (via `langStaticPaths()` in `src/lib/i18n.js`) yields `undefined` (EN at root), `'es'`, `'it'`.

### UI strings — `data/i18n/<lang>.yaml`

Each file is organised by page with YAML comments. Section order is the same across all three files. To rename a label: edit the key in all three files.

### Translatable content fields

Any content field supports `_es` / `_it` override suffixes, resolved by `localize(obj, field, lang)` from `src/lib/i18n.js`:

```yaml
bio: "English bio…"
bio_es: "Bio en español…"
bio_it: "Bio in italiano…"
```

---

## Internationalisation rules (mandatory — all content except teaching)

These rules apply to every content change in: profile, experience, education, awards, talks, projects, and publications. **Teaching** content (subject MDX sessions) is exempt because materials are written once in the language of instruction (subject *titles* in `data/teaching/subjects/` are still translated).

### Rule 1 — Every new content entry must be fully translated

When adding or editing a YAML file in `data/`, **always provide `_es` and `_it` variants** for every human-readable field (`title`, `summary`, `abstract`, `location`, `position`, `full_title`, …). Fields that do NOT need translation: `id`, `date_*`, `url`, `event_url`, `image`, `links`, `lat`, `lng`, `authors`, `tags`, `type`, `featured`, acronyms, proper nouns.

### Rule 2 — i18n files must stay in perfect sync

All three files (`en.yaml`, `es.yaml`, `it.yaml`) must always have **exactly the same set of keys** in the same section order. When adding any new UI key, add it to all three files at once.

### Rule 3 — Components must never contain hardcoded English text

All static text visible to users in `.astro` components must use an i18n variable (`t.key_name`), including `aria-label`, `placeholder`, `alt`, and empty-state messages. Exception: purely technical values (CSS class names, ARIA roles, `type` attributes).

### Rule 4 — Always use `localize()` for content fields

Never access a content field directly when a translated variant might exist. Use `localize(obj, 'fieldName', lang)` from `src/lib/i18n.js` in view models and page frontmatter.

### Verification checklist before committing content changes

- [ ] New YAML file has `_es` and `_it` for all human-readable fields
- [ ] Any new i18n key appears in all three `data/i18n/*.yaml` files
- [ ] No hardcoded English text added to components
- [ ] `npm run build` passes without errors

### Adding a new language

1. Create `data/i18n/<code>.yaml` (copy `en.yaml` as starting point).
2. Add `{ code: '<code>', prefix: '/<code>/' }` to `LANGS` in `src/lib/i18n.js`.
3. Extend `langLinks()` in `src/lib/i18n.js` and the hreflang tags in `BaseLayout.astro`.
4. Run `npm run build`.

---

## Teaching

The teaching section has two levels:
- **Teaching index** (`/teaching/`) — subject card grid + TFG/TFM filtered lists.
- **Subject page** (`/teaching/<id>/`) — Theory/Labs/Seminars tabs; each session renders Markdown, an optional embedded PDF, and an optional external repo link.

### Subject metadata — `data/teaching/subjects/<ID>.yaml`

Metadata only (content lives in MDX):

```yaml
title: "Web Technologies"
title_es: "Tecnologías Web"
title_it: "Tecnologie Web"
order: 1
# hidden: true    # uncomment to exclude subject without deleting it
```

### Session content — `src/content/teaching/<subject-id>/<type-dir>/NN-slug.mdx`

One MDX file per unit/lab/seminar. Directory grouping (`theory/`, `labs/`, `seminars/`) is conventional; the `type` frontmatter field is what determines the tab.

```mdx
---
title: "Lab 1: HTML Basics"
type: lab               # theory | lab | seminar
order: 1
pdf_url: ""             # URL of the session PDF in the external teaching repo
repo_url: ""            # optional external lab-repo link (button in the header)
# hidden: true
---

## Any Markdown heading

Normal **Markdown** with fenced code blocks (Shiki-highlighted at build time).

<Exercise title="Exercise 1.1">

Exercise instructions in Markdown.

</Exercise>
```

The `<Exercise>` component is provided automatically (no import needed) via the `components` prop in the subject page.

### Teaching PDFs — external repository

PDFs live in a **separate GitHub repo**, configured in `src/config.js`:

```js
export const TEACHING_REPO = {
  owner: 'augustocristian',
  repo:  'teaching-materials',   // one folder per subject id
  branch: 'main',
  enabled: false,                // flip to true once the repo exists
};
```

- Set a session's `pdf_url` to the raw URL of its PDF (e.g. `https://raw.githubusercontent.com/<owner>/<repo>/main/<subject-id>/<file>.pdf`). The subject page shows a "View PDF" toggle that lazily embeds an `<iframe>`, plus a "Download PDF" link.
- When `enabled: true`, `GithubPdfList.astro` also fetches the subject's folder listing client-side via the GitHub Contents API and lists every PDF — new uploads appear with **no site rebuild**. Errors (repo missing, rate limit) silently hide the section.
- The teaching index shows an under-construction banner while `TEACHING_UNDER_CONSTRUCTION` is `true` in `src/config.js`.

### TFG / TFM files — `data/teaching/tfgs/<ID>.yaml`

```yaml
title: "Title of the Project"
student: "Student Full Name"
year: 2024
documentation: "https://..."
repo: "https://github.com/..."
```

---

## Build internals

`astro build` (config in `astro.config.mjs`):

1. Pages under `src/pages/[...lang]/` render every route × 3 languages (`langStaticPaths()`).
2. YAML is loaded through the cached loaders in `src/lib/data.js`; view models are built per language in `src/lib/viewmodels.js` (localization, date formatting, BibTeX venue/doi, related-pubs, chips).
3. Teaching MDX renders through the `teaching` content collection (`src/content.config.ts`).
4. The `cite-bib` integration (`src/integrations/cite-bib.mjs`) writes `/cite/<ID>.bib` verbatim into `dist/` at `astro:build:done` (and serves the same URLs on the dev server); `src/pages/sitemap.xml.js` emits the multilingual sitemap; `public/robots.txt` is copied as-is.
5. `public/` (img, files, robots.txt) is copied verbatim; CSS and client JS are bundled/hashed into `dist/_astro/`.

---

## JavaScript architecture

Client scripts live in `src/scripts/` and are bundled by Astro from the `<script>` tag in `BaseLayout.astro`.

```
main.js        — entry point; initializes all controllers on DOMContentLoaded;
                 dynamically imports globe.js only when #globe-viz is present
controller.js  — app logic: initTheme, initNav, initHeaderScroll, initFilters,
                 initPubDetail, initScrollReveal
model.js       — reads DOM state; returns plain data objects
view.js        — pure DOM mutations; never reads state
globe.js       — scroll-driven 3D globe (Globe.gl CDN, IntersectionObserver-deferred)
```

- **`initFilters()`** is one generic engine for every `FilterBar.astro` on the page: each `[data-filter-root]` filters the `[data-filter-item]` children of its `data-target` list. An item matches a facet when its space-separated `data-<facet>` values intersect the active set (OR within a facet, AND across facets); the optional text input substring-matches `data-<searchField>`. With `data-page-size` set (publications page, `pageSize={10}`), matched items are paginated client-side: page/Next/Last buttons render into `[data-pager-for="<target>"]` and the visible range into the `.filter-range`/`.filter-count-n` spans of `[data-count-for="<target>"]`.
- **FilterBar variants**: default `panel` (horizontal boxed bar — TFG/TFM lists) and `sidebar` (vertical checkbox groups used by the publications page: left column on desktop via `.pub-layout`, stacked on top below 900px).
- **`globe.js`**: scroll handler is rAF-throttled; label layout batches all reads (camera matrices, container size, projections) before its style writes; colours are read from the CSS tokens (`--globe-*`, `--color-bg`, `--color-accent`) via `getComputedStyle`, so the globe re-themes with the palette; under `prefers-reduced-motion` it renders a static hemisphere with pins and skips the scroll listener + entrance animation.

Small page-specific scripts (subject-page tab switching + lazy PDF iframes, GitHub PDF listing) live inline in their `.astro` files.

### FOUC prevention

An inline synchronous `<script is:inline>` in `BaseLayout.astro`'s `<head>` reads `localStorage.getItem('theme')` and sets `data-theme` on `<html>` before CSS parses. Do not remove `is:inline` or move the script.

---

## CI/CD

**GitHub Pages** — `.github/workflows/publish.yaml` triggers on push to `main`:
`npm ci` → `npm run build` → upload `./dist` → deploy Pages.

**Netlify** — `netlify.toml`: `command = "npm run build"`, `publish = "dist"`.

No pipeline changes needed when adding new content — just push data files to `main`.

---

## Files not managed by this tooling

- **`README.md`** — never edited by Claude or build scripts.
- **`LICENSE.md`** — never edited by Claude or build scripts.
- **`LEEME.md`** — Spanish quick-start; update manually if the build process changes.
