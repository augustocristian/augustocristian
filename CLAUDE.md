# CLAUDE.md — Augusto's Research Website

This file documents the architecture, data schemas, and build process for this static research website.
**`README.md` and `LICENSE.md` are managed separately and must never be edited by tooling or Claude.**

---

## Overview

Static site built with **Astro** (zero client JS by default). No CMS, no bespoke build script.

- **Data**: YAML files under `data/` define all content (publications, talks, projects, profile, …).
- **Pages/components**: `.astro` files under `src/pages/`, `src/components/`, `src/layouts/`.
- **Build**: `astro build` renders everything to `dist/` (gitignored). CI rebuilds on every push to `main`.
- **Languages**: English (`/`), Spanish (`/es/`), Italian (`/it/`) — UI strings in `data/i18n/`, content fields use `_es` / `_it` suffixes.

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
astro.config.mjs            # Astro config: site URL, trailingSlash, compressHTML, cite-bib
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
  github.yaml               # GitHub page: username + curated repo cards
  teaching/
    courses.yaml            # the teaching record (chart source; see the Teaching section)
    tfgs/<ID>.yaml          # one file per Final Degree Project
    tfms/<ID>.yaml          # one file per Master Degree Project
src/
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
      theses.js             # TFG/TFM lists + filter facets (async — Gravatar lookups)
      teaching.js           # teaching record -> delivery list + filter facets
      github.js             # GitHub page (profile + curated repo cards)
    teaching-aggregate.js   # pure aggregation over the teaching record (server AND client)
    gravatar.js             # build-time Gravatar check (SHA-256, cached, offline-safe)
    richtext.js             # mini-markdown for YAML fields ([link](url), _em_, "- " bullets)
    bibtex.js               # minimal BibTeX parser (venue, doi, LaTeX accents)
    icons.js                # loadIcon(name) — inline SVG from public/img/icons
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
    TeachingRecord.astro    # teaching-record tiles + two bar charts + filters + table
  pages/
    [...lang]/index.astro                       # homepage (undefined → /, 'es', 'it')
    [...lang]/publications/index.astro
    [...lang]/talks/index.astro
    [...lang]/projects/index.astro
    [...lang]/experience/index.astro
    [...lang]/github/index.astro                # GitHub profile + curated repos (live stats)
    [...lang]/teaching/index.astro              # teaching record chart + TFG/TFM lists
    sitemap.xml.js                              # sitemap endpoint (same URL set as before)
  styles/                   # CSS partials imported by styles/main.css (bundled by Vite)
    main.css  core/  layout/  home/  research/  experience/  projects/  talks/  github/
    teaching/  (teaching.css  courses.css)
  scripts/                  # client JS, bundled by Astro from BaseLayout's <script>
    main.js                 # entry; inits controllers
    controller.js  model.js  view.js
public/                     # copied verbatim to dist/ — root-absolute URLs (/img/…, /files/…)
  img/  files/  robots.txt
scripts/
  deploy.ps1  deploy.sh     # npm install + build + optional preview
dist/                       # GENERATED — gitignored, do not edit manually
```

---

## Build & performance notes

- **CSS**: `src/styles/main.css` is imported once in `BaseLayout.astro`; Vite resolves the whole `@import` chain into a single hashed stylesheet — no `@import` waterfall.
- **Zero JS by default**: only `src/scripts/main.js` (theme/nav/filters/detail overlay/scroll reveal, a few KB) ships on every page.
- **Fonts**: non-blocking `media="print"` swap trick, declared once in `components/FontLinks.astro` and used by both layouts.
- **Images**: `public/img/` holds web-sized copies only — sources are downscaled to what the CSS actually renders (avatars 96px, hero 640px, card art 1200px wide) and the untouched originals live in `.image-originals/` (gitignored). Everything below the fold carries `loading="lazy" decoding="async"`; the hero photo is the LCP element, so it stays eager with `fetchpriority="high"`. This took the homepage from 4.05 MB of imagery to 0.71 MB.
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
  --color-on-accent   /* label on an accent fill — see the contrast note below */
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
  /* Globe: --globe-* — orphaned (the homepage globe was removed); kept in case it returns */
  --font-display: 'Noto Sans Display', system-ui, sans-serif;      /* h1–h5, code chips */
  --font-body:    'Inter', system-ui, -apple-system, sans-serif;   /* all body text */
  /* All three come from Google Fonts via components/FontLinks.astro — the single
     place the webfont <link>s are declared, so the layouts cannot drift onto
     different families (they did once: a layout kept requesting a family the
     site had dropped, and its headings silently fell back to Georgia).
     Change a family here AND in FontLinks.astro.
     Noto Sans Display is variable (400..700 requested), so 600/700 are real cuts. */
  --container-width: 1140px;  --header-height: 4.5rem;
}
```

**Contrast (WCAG AA, verified):** the accent has two roles that pull in opposite directions — as TEXT on a dark surface it must be light, as a FILL under white text it must be dark. One value cannot do both, so `--color-accent` is the text/border value (dark `#36A2F5`, light `#0E62A3`; both clear 4.5:1 on bg, surface, surface-2 and accent-soft) and `--color-on-accent` is the label placed on an accent fill (navy in dark, white in light). Never write `color: #fff` on `background: var(--color-accent)` — that combination fails AA in the dark theme; use `var(--color-on-accent)`.

**Heading level ≠ heading size.** Levels are chosen so each page's outline has no gaps (a card title is `h2` on a listing page, `h3` under a section head), so card CSS must never key off the element: rules are written `.pub-card :is(h2, h3)`, `.thesis-card :is(h3, h4)` and always pin an explicit `font-size`. Promoting a heading without that pin makes it inherit the much larger `base.css` element size.

Rules of thumb: borders are `var(--border-w) solid var(--color-border)` (never hardcode widths), shadows come only from `--shadow-1/2/3`, durations/easings only from the motion tokens. To retune colours or fonts, edit tokens and run `npm run dev` / `npm run build`.

---

## Motion & view transitions

Defined in `src/styles/core/animations.css` + `transitions.css`; scroll-reveal JS in `src/scripts/controller.js`.

- **Hover/reveal contract**: interactive hover lifts animate the `translate` property (`translate: 0 -1px/-2px` + one elevation step up); entrance/reveal animations animate `transform`. The two compose on the compositor — never set `translate` in a reveal rule or it kills the hover lift. The mirror rule matters just as much: `.reveal--card.is-visible` lands in the SAME style change that starts the reveal, so `opacity`/`transform` must keep `--dur-3` **and** `var(--reveal-delay)` there — putting them on `--dur-1` cuts every card's entrance to 150 ms and drops the stagger, and the grid snaps in instead of floating in. Only `translate`/`box-shadow` belong on the short duration.
- **Scroll reveal** (site-wide): IntersectionObserver-driven, **fires once** per element (`.reveal`/`.reveal--card` + `.is-visible`); cards in the same parent stagger by 0.08 s via `--reveal-delay`. Whether an element starts on screen is decided by the **observer's first callback**, never by measuring in JS: at `DOMContentLoaded` the webfonts have not swapped in yet (`FontLinks.astro` loads them async), so a `getBoundingClientRect()` check reads fallback-metric layout and puts elements on the wrong side of the fold — they get treated as already visible and never animate, worsening down long pages. Elements on screen at load are left untouched (no reveal classes at all, so `.card-link` keeps its own hover transition); the rest are hidden on that first callback and animated when scrolled to. Targets come from `revealTargets()` in `src/scripts/model.js`: section heads, standalone tag rows, `.card-link`/`.talk-card`/`.timeline-item`/`.proj-item`/`.award-card`, plus the **containers** of filtered lists (never the `[data-filter-item]` items themselves — `initFilters` toggles their `display`, which would strand reveal-hidden items).
- **Hero & page-header entrance**: CSS-only staggered `rise-in` keyframes on `.hero-content` children + photo and on `.page-header` children (`animation … backwards`), no JS — safe above the fold.
- **Publication detail dialog**: opens/closes with a fade + rise via `@starting-style` + `transition-behavior: allow-discrete` (`publications.css`) — pure CSS progressive enhancement; unsupported browsers get the instant open/close.
- **Header scroll state**: `initHeaderScroll()` (rAF-guarded) toggles `.site-header.is-scrolled` → hairline + `--shadow-1` + stronger blur.
- **Cross-document view transitions**: pure CSS `@view-transition { navigation: auto }` (200/250 ms crossfade) in `transitions.css`; the header has `view-transition-name: site-header` so the chrome stays stable. Progressive enhancement, zero JS — do **not** add Astro's `<ClientRouter/>`.
- Everything is gated behind `prefers-reduced-motion: no-preference` (reveals, hero/page-header entrance, dialog animation, smooth scrolling, view transitions).

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
lat: 37.5665              # optional — unused since the homepage globe was removed
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

### GitHub page — `data/github.yaml`

Drives the `/github/` page (nav item `nav_github`): a profile header + curated repository cards.

```yaml
username: augustocristian    # profile link, avatar and live-stat lookups
name: "Cristian Augusto"     # optional display name (falls back to username)
repos:
  - name: repo-name          # repository under `username` (also the card link)
    description: "Owner-maintained English description."
    description_es: "Descripción en español."
    description_it: "Descrizione in italiano."
    topics: [testing, e2e]   # optional — rendered as tag pills
```

- Descriptions live here (not fetched) so they follow the i18n rules; curate/reorder the list freely.
- The avatar uses GitHub's stable redirect `https://github.com/<username>.png` — no API call.
- **Live stats** (profile followers/public-repo counts; per-repo stars/forks/language) are fetched client-side from the GitHub REST API by the page's inline script. Stat elements ship `hidden` and are revealed only on success — on any error or rate limit (60 req/h per visitor IP, 1 + N(repos) requests) the page silently stays complete without them (same pattern as `GithubPdfList.astro`).

---

## Homepage globe (removed)

The scroll-driven 3D globe was removed (commit "Removed globe"). The `--globe-*` tokens in `tokens.css` and the `lat:`/`lng:` publication fields are orphaned but kept in case it returns.

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

These rules apply to every content change in: profile, experience, education, awards, talks, projects, publications and teaching. In `data/teaching/courses.yaml` the subject and degree names are the institution's own official Spanish wording and are **not** translated — translating an official course title would misrepresent the certificate; everything the chart says *about* them lives in `data/i18n/`.

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

One page, `/teaching/`: the **teaching record** (a filterable chart of every course taught) followed by the supervised **TFG/TFM** lists. There are no per-subject pages — course materials, lesson content, planning tables, `.ics` export and the embeddable subject view were all removed; if they ever come back, they come back as their own thing rather than by reviving the old subject collection.

### Teaching record — `data/teaching/courses.yaml`

Transcribed from the official teaching certificate (Universidad de Oviedo). **The source PDF is gitignored** — it carries a national ID number and must not reach the repository.

The unit is a **delivery**: one subject in one academic year. A delivery can reach several degrees; that is one class with several audiences, so **its hours are counted once**, not once per degree. This is not a modelling preference — it is what makes the numbers reconcile: summing the certificate's rows for 2025-2026 gives 376 h, while the certificate's own yearly total is 186 h.

```yaml
degrees:                          # id -> short label (chart) + full name (tooltip)
  giitin: { short: "Ing. Informática en TI", level: grado, full: "Grado en Ingeniería…" }

courses:
  - year: "2025-2026"
    status: delivered             # delivered | programmed (scheduled, not yet fully taught)
    position: "Profesor Ayudante Doctor LOSU"
    official_total: 186.0         # the certificate's «Horas Curso» — the check value
    teaching:
      - subject: "Tecnologías Web"
        shared: true              # «docencia compartida» (the certificate's *)
        english: true             # optional
        theory: 0.0
        practice: 98.0
        hours: 98.0
        degrees: [{ id: giitin, year: 4 }, { id: master_ii, year: 1 }]
```

**`official_total` is a checksum, not decoration.** Every year's `hours` must sum to it; all seven do. After editing this file, verify:

```sh
node -e "const y=require('js-yaml'),f=require('fs');const d=y.load(f.readFileSync('data/teaching/courses.yaml','utf8').replace(/^﻿/,''));for(const c of d.courses){const s=c.teaching.reduce((a,t)=>a+t.hours,0);if(Math.abs(s-c.official_total)>0.001)throw new Error(c.year+': '+s+' != '+c.official_total)}console.log('all years match the certificate')"
```

Current record: **1 417,2 h · 30 deliveries · 11 subjects · 12 degrees · 7 academic years** (2019-2020 → 2026-2027; 2021-2022 is absent because no teaching was assigned).

### The chart — `components/TeachingRecord.astro`

Four summary tiles, two bar charts and a table view, all driven by one filter row (academic year + degree).

- **Identity lives in the row label, not in colour**, so the charts need only **two** categorical series — lecture vs lab — rather than one hue per subject. Eleven hues would break the "assign categorical hues in fixed order, never cycled" rule; eleven labelled rows do not.
- **Bar length is absolute hours** (rows comparable across subjects and years) and each bar's split shows composition; the share label states the proportion outright.
- Both palettes were run through the data-viz validator against this site's real chart surfaces and pass every check — lightness band, chroma floor, CVD separation, normal-vision floor, contrast:

  | | lecture | lab | surface |
  |---|---|---|---|
  | light | `#0E62A3` | `#eb6834` | `#FFFFFF` |
  | dark | `#3987e5` | `#d95926` | `#162B42` |

  The dark steps are **chosen for the dark surface**, not flipped from the light ones, and the chart blue is a step of its own — it is deliberately not the UI's `--color-accent`, whose job is text contrast. Re-run the validator if you change them.
- Aggregation lives in **`src/lib/teaching-aggregate.js`**, imported by both the Astro frontmatter (which server-renders the unfiltered charts, so the page works with JS off) and the component's client script (which re-renders on filter). One implementation, so the two can never disagree.
- A legend is always present (two series) and every bar is directly labelled, so identity never rests on colour alone; the `<details>` table view carries the full per-delivery detail.

**Four views, one filter row**, in this order: the summary tiles (kept at the top, always showing the filtered totals), the two hour bar charts, then two degree-centric views:

| View | Mark | Answers |
|---|---|---|
| Hours by subject / by year | stacked bars | what and when |
| **Presence in each degree** | one stacked mini-column per academic year, on a shared baseline | where, and for how many years running |
| **Subject → degree flow** | two HTML columns + an SVG link overlay | why a degree adds up to what it does |

Two rules these last two must keep:

- **They use FULL attribution** — a shared subject's hours count for every degree it reached — so their totals (2 633 h) deliberately exceed the certified total (1 417 h). They answer *where have I been present*, not *how do the hours divide*. `teaching_attribution_note` says so on the page; never mix the two sums.
- **All four views keep the same lecture/lab split**, so the two hues always mean the same thing and one legend governs the lot. The timeline uses columns rather than dots for exactly this reason: a dot cannot carry a split, and length compares better than area. An untaught year is an empty lane over the baseline, never a tiny mark — "absent" must not read as "a little".

The flow's curves are drawn from **measured** node geometry (`getBoundingClientRect`), redrawn on filter and via `ResizeObserver`, so they stay correct after any reflow or font swap. The columns themselves are ordinary HTML, so with JS off the relationships still read as two labelled lists — only the curves are missing. Below 900px the curves are hidden and the columns stack.

### TFG / TFM files — `data/teaching/tfgs/<ID>.yaml`

```yaml
title: "Title of the Project"
student: "Student Full Name"
year: 2024
degree: "Computer Engineering (IT)"                 # optional — chip on the card + filter facet
degree_es: "Ingeniería Informática en Tecnologías de la Información"
degree_it: "Ingegneria Informatica nelle Tecnologie dell'Informazione"
degree_logo: "img/org/org-epigijon.svg"             # optional — school logo inside the degree chip
institution_logo: "img/org/org-uniovi.svg"          # optional — card-header logo + filter facet
documentation: "https://..."                        # optional — "Documentation" button
repo: "https://github.com/..."                      # optional — "Repository" button
email: "student@example.com"                        # optional — Gravatar lookup (see below)
linkedin: "https://www.linkedin.com/in/example/"    # optional — student name links here
```

- The **Documentation/Repository buttons** are fully wired end-to-end (`ThesisSection.astro`, `theses.js`, i18n keys `teaching_documentation`/`teaching_repository`) — filling the URLs above is all it takes for them to appear; empty strings render nothing.
- **Student avatars**: when `email:` is set, the build SHA-256-hashes the trimmed+lowercased address and checks Gravatar (`?d=404`) via `src/lib/gravatar.js`. Students with a Gravatar get their photo; everyone else gets the initials avatar. Only the hash is ever published — never the address. Lookups are promise-cached per email (one HEAD request each per build) and any network failure falls back to initials, so **offline builds never break**. This is the only build-time network access on the site (`buildThesisViewModels` is async because of it).
- **LinkedIn**: when `linkedin:` is set, the student's name in the card links to it (rendered through `AuthorChip`).

---

## Build internals

`astro build` (config in `astro.config.mjs`):

1. Pages under `src/pages/[...lang]/` render every route × 3 languages (`langStaticPaths()`).
2. YAML is loaded through the cached loaders in `src/lib/data.js`; view models are built per language in `src/lib/viewmodels.js` (localization, date formatting, BibTeX venue/doi, related-pubs, chips).
3. The `cite-bib` integration (`src/integrations/cite-bib.mjs`) writes `/cite/<ID>.bib` verbatim into `dist/` at `astro:build:done` (and serves the same URLs via dev-server middleware). `src/pages/sitemap.xml.js` emits the multilingual sitemap; `public/robots.txt` is copied as-is.
4. `public/` (img, files, robots.txt) is copied verbatim; CSS and client JS are bundled/hashed into `dist/_astro/`.

---

## JavaScript architecture

Client scripts live in `src/scripts/` and are bundled by Astro from the `<script>` tag in `BaseLayout.astro`.

```
main.js        — entry point; initializes all controllers on DOMContentLoaded
controller.js  — app logic: initTheme, initNav, initHeaderScroll, initFilters,
                 initPubDetail, initScrollReveal
model.js       — reads DOM state; returns plain data objects
view.js        — pure DOM mutations; never reads state
```

- **`initFilters()`** is one generic engine for every `FilterBar.astro` on the page: each `[data-filter-root]` filters the `[data-filter-item]` children of its `data-target` list. An item matches a facet when its space-separated `data-<facet>` values intersect the active set (OR within a facet, AND across facets); the optional text input substring-matches `data-<searchField>`. With `data-page-size` set (publications page, `pageSize={10}`), matched items are paginated client-side: page/Next/Last buttons render into `[data-pager-for="<target>"]` and the visible range into the `.filter-range`/`.filter-count-n` spans of `[data-count-for="<target>"]`.
- **FilterBar variants**: default `panel` (horizontal boxed bar — TFG/TFM lists) and `sidebar` (vertical checkbox groups used by the publications page: left column on desktop via `.pub-layout`, stacked on top below 900px).
- **`initScrollReveal()`** runs site-wide (skipped under `prefers-reduced-motion: reduce`); reveal targets and the filtered-list container rule live in `revealTargets()` (`model.js`).

Small page-specific scripts live inline in their own `.astro` files, outside the main bundle: the teaching-record filters (`TeachingRecord.astro`, ~2.9 KB) and the GitHub live stats (`github/index.astro`).

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
