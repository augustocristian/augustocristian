import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import citeBib from './src/integrations/cite-bib.mjs';

export default defineConfig({
  site: 'https://www.augustocristian.es',
  trailingSlash: 'always',
  // Keep classic HTML whitespace collapsing — Astro 7's new 'jsx' default
  // strips the space between adjacent inline elements (icon + label buttons).
  compressHTML: true,
  integrations: [mdx(), citeBib()],
  markdown: {
    // Dual-theme code highlighting: emits --shiki-light/--shiki-dark CSS vars
    // per token; subject.css switches them with the site theme.
    shikiConfig: {
      themes: { light: 'github-light', dark: 'github-dark' },
      defaultColor: false,
    },
  },
});
