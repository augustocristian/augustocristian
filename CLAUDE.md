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
  github.yaml               # GitHub page: username + curated repo cards
  teaching/
    subjects/<ID>.yaml      # subject METADATA only (title/_es/_it, order, guide_url, hidden, image)
    schedule/<ID>.yaml      # week-by-week planning -> planning table + .ics export
    tfgs/<ID>.yaml          # one file per Final Degree Project
    tfms/<ID>.yaml          # one file per Master Degree Project
src/
  config.js                 # TEACHING_UNDER_CONSTRUCTION + TEACHING_REPO (incl. pages_url) + teachingPdfUrl()
  content.config.ts         # `teaching` content collection (MDX) schema
  content/teaching/         # session content: <subject-id>/<theory|labs|seminars>/NN_slug/index.mdx
  integrations/
    cite-bib.mjs            # emits /cite/<ID>.bib into dist/ + serves them on the dev server
    teaching-ics.mjs        # emits /calendar/<subject>-<group>.ics (+ -completo.ics)
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
      github.js             # GitHub page (profile + curated repo cards)
    schedule.js             # planning loader: week expansion + dated event list (tz-safe)
    ics.js                  # minimal RFC 5545 writer (CRLF, 75-octet folding, UTC stamps)
    gravatar.js             # build-time Gravatar check (SHA-256, cached, offline-safe)
    richtext.js             # mini-markdown for YAML fields ([link](url), _em_, "- " bullets)
    bibtex.js               # minimal BibTeX parser (venue, doi, LaTeX accents)
    icons.js                # loadIcon(name) — inline SVG from public/img/icons
    teaching.js             # teaching-collection helpers: derives type/order/code from the path
  layouts/
    BaseLayout.astro        # <head> (SEO/hreflang/fonts/theme FOUC guard), Header, Footer,
                            # global CSS import, client script entry
    EmbedLayout.astro       # bare shell for /teaching/<id>/embed/ (no header/footer, noindex)
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
    SubjectContent.astro    # subject body (lesson sidebar + one lesson at a time), shared
                            # by the normal subject page and its /embed/ twin
    SubjectPlanning.astro   # planning table + course-guide link + .ics export
    PdfViewer.astro         # multi-document lazy PDF <iframe> + availability probe
    Video.astro             # lazy YouTube embed (nocookie iframe on click; MDX-injectable)
    GithubPdfList.astro     # live PDF listing from the external teaching repo
  pages/
    [...lang]/index.astro                       # homepage (undefined → /, 'es', 'it')
    [...lang]/publications/index.astro
    [...lang]/talks/index.astro
    [...lang]/projects/index.astro
    [...lang]/experience/index.astro
    [...lang]/github/index.astro                # GitHub profile + curated repos (live stats)
    [...lang]/teaching/index.astro
    [...lang]/teaching/[subject]/index.astro        # subject page (planning + lessons)
    [...lang]/teaching/[subject]/embed/index.astro  # same, bare shell, for iframe embedding
    sitemap.xml.js                              # sitemap endpoint (same URL set as before)
  styles/                   # CSS partials imported by styles/main.css (bundled by Vite)
    main.css  core/  layout/  home/  research/  experience/  projects/  talks/  github/
    teaching/  (teaching.css  subject.css  planning.css  embed.css)
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
  /* Globe: --globe-* — orphaned (the homepage globe was removed); kept in case it returns */
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
- **Scroll reveal** (site-wide): IntersectionObserver-driven, **fires once** per element (`.reveal`/`.reveal--card` + `.is-visible`); cards in the same parent stagger by 0.08 s via `--reveal-delay`. Elements already in the viewport on load appear instantly. Targets come from `revealTargets()` in `src/scripts/model.js`: section heads, standalone tag rows, `.card-link`/`.talk-card`/`.timeline-item`/`.proj-item`/`.award-card`, plus the **containers** of filtered lists (never the `[data-filter-item]` items themselves — `initFilters` toggles their `display`, which would strand reveal-hidden items).
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
- **Subject page** (`/teaching/<id>/`) — docs-style layout: a collapsible left sidebar lists the course **planning** plus every lesson grouped Theory/Labs/Seminars; the content area shows **one lesson at a time**, driven by the URL hash (`#<group>/<slug>`, e.g. `#labs/01_entorno-y-primer-servicio` — shareable deep links; legacy `#theory`/`#labs`/`#seminars` map to that group's first lesson). Every lesson renders Markdown, its PDFs in an on-page viewer, an optional YouTube video, an optional external repo link, and a prev/next pager. All lessons are server-rendered: no-JS and print show them stacked. Sidebar visibility persists on desktop (`localStorage['teaching-nav']`) and defaults to hidden ≤900px (stacked panel, auto-closes on selection). Lessons are display-toggled — never give them scroll-reveal classes.

The subject body lives in **`SubjectContent.astro`**, shared verbatim by the normal page and the embeddable one, so the two can never drift.

### Adding a session (the common case)

Create a numbered folder with an `index.mdx` in it. Nothing else — no index to update, no numbers to shuffle:

```
src/content/teaching/<subject-id>/<group>/<NN_slug>/index.mdx
                                   ▲        ▲
                                   │        └── sort order + sidebar code + deep-link slug
                                   └── theory | labs | seminars  →  the session type
```

The path carries the metadata that used to be typed by hand (parsed in `src/lib/teaching.js`):

| From the path | Becomes |
|---|---|
| `theory/` · `labs/` · `seminars/` | the session `type` (and the sidebar group) |
| the `NN` in `NN_slug` | the sort `order` |
| the letter suffix in `NNx_slug` (`02d`) | `order + 0.0x`, so `02d` sorts between `02` and `03` **without renumbering anything** |
| `NN[x]` + the group letter (`T`/`S`/`PA`) | the sidebar code — `T02d`, `S09b` |
| the whole `NN_slug` folder name | the deep-link slug (`#theory/02d_solid-y-patrones`) |

So the frontmatter is only what the session actually *has*:

```mdx
---
title: "Capa web REST"
summary: "Qué hace que una API sea REST y cómo se escribe esa capa en Spring."
pdfs:
  - label: "Apuntes"
    file: "apuntes/03 Capa web REST.pdf"
# video_url: "" · repo_url: "" · hidden: true   — all optional
# type / order / code override the path-derived values; normally omit them
---

## Contenidos

Normal **Markdown** with fenced code blocks (Shiki-highlighted at build time).

<Exercise title="Ejercicio 1.1">Instrucciones en Markdown.</Exercise>
<Video url="https://youtu.be/XXXXXXXXXXX" label="Introducción al tema" />
```

`<Exercise>` and `<Video>` are injected automatically (no import needed). A flat `NN_slug.mdx` with no folder still works (`software-process-engineering` uses it); prefer a folder so a session can keep its own images beside it.

**Teaching content is i18n-exempt** — it is written once in the language of instruction. Subject *titles* in `data/teaching/subjects/` are still translated.

### Subject metadata — `data/teaching/subjects/<ID>.yaml`

```yaml
title: "Web Technologies"
title_es: "Tecnologías Web"
title_it: "Tecnologie Web"
order: 1
guide_url: ""    # official course guide; renders a button on the planning lesson
image: ""        # optional — index-card + subject-page banner, path under public/
# hidden: true   # uncomment to exclude the subject without deleting it
```

### Planning & calendar export — `data/teaching/schedule/<ID>.yaml`

Optional. When present, the subject page gains a **Planning** lesson as its landing view (course facts, the link to the official guide, a subgroup picker and the week-by-week calendar), and the build emits downloadable `.ics` files. Without it a subject simply starts on its first lesson.

**One file, two outputs** — the table and the calendars are generated from the same weeks, so they can never disagree:

```yaml
course: "2026/2027"
code: "GIITIN01-4-012"
timezone: "Europe/Madrid"          # IANA zone; DST is resolved via Intl, never hardcoded
location: "Escuela Politécnica de Ingeniería de Gijón"

groups:                             # lab subgroups: weekday (0 = Mon … 4 = Fri) + slot
  - { id: "PL-01", weekday: 2, start: "16:00", end: "18:00" }

weeks:
  - n: 3
    start: "2026-09-21"             # ALWAYS the Monday; lab dates derive from it
    note: "Footnote shown under the week"
    labs:
      session: "S01"
      lesson: "labs/01_entorno-y-primer-servicio"   # makes the row link to the lesson
      title: "Entorno y primer servicio"
      extra: "Git avanzado (práctica de aula)"      # optional second activity
      groups:                       # optional per-subgroup overrides
        PL-04:
          moved_to: "2026-10-15"    # make-up session on another date
          reason: "Festivo — recuperación en jueves"
        PL-02:
          cancelled: true
          reason: "Festivo (Inmaculada Concepción)"
      # cancelled: true             # at this level: cancels the week for every subgroup
    theory:                         # explicit date + times (exceptional slots are just rows)
      - date: "2026-09-22"
        start: "16:00"
        end: "17:00"
        kind: theory                # theory | pa  (pa renders a "Práctica de aula" tag)
        title: "T02 Introducción a Spring Boot"
        detail: "Optional second line"
        lessons: ["theory/02_introduccion-spring-boot"]
        # tentative: true           # renders a "por confirmar" tag
    events:                         # one-off items (defences, exams)
      - { date: "2026-11-04", start: "14:00", end: "16:00", kind: exam, title: "Defensa" }
```

- **Dates are quoted strings.** Unquoted, js-yaml turns `2026-09-14` into a UTC `Date` and the formatting control is lost.
- **Lab dates are derived** from the week's Monday + the subgroup's `weekday`; only exceptions need an override.
- `buildPlanningWeeks()` also exposes `primary` (the session most subgroups run that week) and `allCancelled`, so the component never re-scans the list.

**Calendar files** (`src/integrations/teaching-ics.mjs`, written into `dist/` at `astro:build:done` and served by dev-server middleware):

| URL | Contents |
|---|---|
| `/calendar/<subject>-<group>.ics` | that subgroup's labs + all theory/PA + all events — a student's personal calendar |
| `/calendar/<subject>-completo.ics` | every subgroup's labs + all theory/PA + all events — the teacher's calendar |

The subgroup `<select>` on the planning drives **both** the highlighted rows and which `.ics` the download button points at (remembered in `localStorage['teaching-group']`).

`src/lib/ics.js` is a small RFC 5545 writer, strict about the parts Outlook rejects: CRLF endings, every line folded at **75 octets** (never mid-codepoint), TEXT values escaped, and `DTSTART`/`DTEND` emitted as **absolute UTC** (`…Z`) rather than `TZID` — so no `VTIMEZONE` block is needed and Google Calendar, Outlook (desktop + web) and Apple Calendar all resolve the same instant. Local wall time is converted in `zonedToUtc()` (`src/lib/schedule.js`) with a two-pass `Intl` offset lookup, which stays correct across a DST transition. `DTSTAMP` is fixed so rebuilds are byte-identical.

### Teaching PDFs — external repository (must be GitHub **Pages**)

PDFs live in a separate repo, configured in `src/config.js`:

```js
export const TEACHING_REPO = {
  owner: 'augustocristian',
  repo: 'teaching-materials',      // one folder per subject id
  branch: 'main',
  pages_url: 'https://augustocristian.github.io/teaching-materials',
  enabled: false,                  // true once the repo AND its Pages site exist
  list_path: 'practicas',          // subfolder the live listing enumerates (not recursive)
};
```

> **Never link PDFs through `raw.githubusercontent.com`.** It serves them as `application/octet-stream` with `X-Content-Type-Options: nosniff`, so browsers refuse to render them inline and an `<iframe>` just downloads the file. GitHub **Pages** serves the same file as `application/pdf` (plus `Access-Control-Allow-Origin: *`), which is what makes the on-page viewer — and the availability probe — work. `pages_url` must therefore point at the repo's Pages site.

Sessions reference documents by **repo-relative path**, and `teachingPdfUrl(subjectId, file)` builds the absolute URL (percent-encoding each segment, so the LaTeX-generated names with spaces and accents survive):

```yaml
pdfs:
  - { label: "Guion",      file: "practicas/Sesion1. Entorno y primer servicio.pdf" }
  - { label: "Ejercicios", file: "practicas/Ejercicios Sesion1. Entorno y primer servicio.pdf" }
```

> **Exercise solutions are never published.** `Solucion Ejercicios SesionN.pdf` is course-private, permanently — not a "publish it after the session" case. Sessions link only the *guion* and the *exercise sheet*. This is enforced, not just conventional (`TEACHING_PRIVATE_PATTERN` in `src/config.js`):
> 1. **The build fails** if a session's `pdfs:` lists a file or label matching `soluci[oó]n|solution` (thrown in `src/lib/teaching.js`).
> 2. **The live repo listing filters them out** (`GithubPdfList.astro`), so copying the whole `pdf-practicas/` folder into the materials repository cannot surface them there either.
>
> Do not add an "unlock later" flag for these. If a solution ever needs sharing, it goes through a channel that is not this site.

`PdfViewer.astro` renders a document switcher (only when a session has more than one), a lazy **View PDF** toggle that creates the `<iframe>` on first click, and a download link. Because materials are published week by week, it **HEAD-probes each URL** the first time a viewer scrolls into view: a document that is not up yet shows *"todavía no publicado"* with the controls disabled, and starts working the moment the file is pushed — **no site rebuild**. Probes are cached per URL and any network failure degrades to the pending state. With `enabled: true`, `GithubPdfList.astro` additionally lists the subject's folder live via the GitHub Contents API.

The teaching index shows an under-construction banner while `TEACHING_UNDER_CONSTRUCTION` is `true` in `src/config.js`.

### Embeddable subject page — `/teaching/<id>/embed/`

Every subject also builds a bare variant for dropping into a Campus Virtual / Moodle page:

```html
<iframe src="https://www.augustocristian.es/es/teaching/web-technologies/embed/"
        style="width:100%;height:80vh;border:0" loading="lazy"
        title="Tecnologías Web"></iframe>
```

Same lesson browser, same content component; `EmbedLayout.astro` replaces the site chrome with a slim bar (title, theme toggle, "open full page" in `_blank`). It is `noindex, follow` with `<link rel="canonical">` on the real page, so the embeds never compete in search. Deep links work inside the frame — append the lesson hash to the `src`.

**No `X-Frame-Options` or `frame-ancestors` CSP is sent anywhere on this site**, which is what allows framing. If a `_headers` / `netlify.toml` headers block is ever added, it must not reintroduce them.

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
3. Teaching MDX renders through the `teaching` content collection (`src/content.config.ts`).
4. The `cite-bib` integration (`src/integrations/cite-bib.mjs`) writes `/cite/<ID>.bib` verbatim into `dist/` at `astro:build:done`, and `teaching-ics` (`src/integrations/teaching-ics.mjs`) writes `/calendar/<subject>-<group>.ics` the same way (both also serve their URLs via dev-server middleware). `src/pages/sitemap.xml.js` emits the multilingual sitemap; `public/robots.txt` is copied as-is.
5. `public/` (img, files, robots.txt) is copied verbatim; CSS and client JS are bundled/hashed into `dist/_astro/`.

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

Small page-specific scripts live inline in their own `.astro` files, outside the main bundle: the lesson router + sidebar toggle (`SubjectContent.astro`), the planning subgroup picker (`SubjectPlanning.astro`), the GitHub PDF listing (`GithubPdfList.astro`), and the lazy PDF and video embeds (`PdfViewer.astro`, `Video.astro`). `EmbedLayout.astro` deliberately ships **only** a theme toggle — the embed has no nav, filters or scroll reveal, so it never loads `main.js`.

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
