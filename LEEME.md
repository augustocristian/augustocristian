# 1. About this project
This website is built with [Astro](https://astro.build): content lives as YAML files under
`data/` (and teaching sessions as Markdown/MDX under `src/content/teaching/`), rendered
through Astro components (`src/components/`, `src/pages/`) into plain HTML/CSS/JS in
`dist/`. See [CLAUDE.md](CLAUDE.md) for the full architecture and a guide to adding new
publications, talks, projects, education/experience entries, etc.

# 2. Modify the website content and preview it locally
1. Install [Node.js](https://nodejs.org/) (v22 or later).
2. Install dependencies:
    ```powershell
    npm install
    ```
3. Edit the relevant file(s) under `data/` (see [CLAUDE.md](CLAUDE.md) for the data schemas).
4. Start the dev server with live reload:
    ```powershell
    npm run dev
    ```
    Then open http://localhost:4321.

Alternatively, build the production site with `npm run build` and preview the result with
`npm run preview`, or combine both with `scripts/deploy.ps1 -Serve`, which serves the built
site at http://localhost:8080.

# 3. Deployment
Pushing to `main` triggers `.github/workflows/publish.yaml`, which runs `npm run build` and
deploys `dist/` to GitHub Pages. Netlify builds with the same command (see `netlify.toml`).
