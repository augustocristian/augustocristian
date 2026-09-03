// Multilingual sitemap — the 7 standard pages across the 3 language prefixes.
import { LANGS } from '../lib/i18n.js';
import { loadProfile } from '../lib/data.js';

export function GET() {
  const profile = loadProfile();
  const pages = ['', 'publications/', 'talks/', 'projects/', 'teaching/', 'experience/', 'github/'];

  const entries = [];
  for (const { code } of LANGS) {
    const base = code === 'en' ? '/' : `/${code}/`;
    for (const p of pages) {
      const loc = new URL(base + p, profile.site_url).toString();
      entries.push(`  <url><loc>${loc}</loc></url>`);
    }
  }

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries.join('\n')}\n</urlset>\n`;
  return new Response(sitemap, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
}
