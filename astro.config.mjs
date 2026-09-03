import { defineConfig } from 'astro/config';
import citeBib from './src/integrations/cite-bib.mjs';

export default defineConfig({
  site: 'https://www.augustocristian.es',
  trailingSlash: 'always',
  // Keep classic HTML whitespace collapsing — Astro 7's new 'jsx' default
  // strips the space between adjacent inline elements (icon + label buttons).
  compressHTML: true,
  integrations: [citeBib()],
});
