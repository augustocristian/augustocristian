// Multilingual sitemap — same URL set as the old build: 6 standard pages plus
// one page per visible teaching subject, across the 3 language prefixes.
import { LANGS } from '../lib/i18n.js';
import { loadProfile, loadSubjects } from '../lib/data.js';

export function GET() {
  const profile = loadProfile();
  const subjectPaths = loadSubjects()
    .filter((s) => !s.hidden)
    .map((s) => `teaching/${s.id}/`);
  const pages = ['', 'publications/', 'talks/', 'projects/', 'teaching/', 'experience/', ...subjectPaths];

  const entries = [];
  for (const { code } of LANGS) {
    const base = code === 'en' ? '/' : `/${code}/`;
    for (const p of pages) {
      entries.push(`  <url><loc>${new URL(`${base}${p}`, profile.site_url).toString()}</loc></url>`);
    }
  }

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries.join('\n')}\n</urlset>\n`;
  return new Response(sitemap, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
}
