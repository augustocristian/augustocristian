// Emits one downloadable calendar per lab subgroup (plus a combined one) for
// every subject that has a planning file under data/teaching/schedule/:
//
//   /calendar/<subject-id>-<group-id>.ics   e.g. /calendar/web-technologies-PL-01.ics
//   /calendar/<subject-id>-completo.ics     every subgroup, for the teacher
//
// Same shape as the cite-bib integration, and for the same reason: since Astro 6
// a dynamic endpoint with a file extension is unreachable under this site's
// `trailingSlash: 'always'`, so the files are written straight into dist/ and
// served by a dev-server middleware so the URLs also work under `npm run dev`.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadSubjects } from '../lib/data.js';
import { loadSchedule, buildCalendarEvents } from '../lib/schedule.js';
import { buildIcs } from '../lib/ics.js';

// Calendar file name -> ICS text, for every scheduled subject.
function buildAll() {
  const files = new Map();
  for (const subject of loadSubjects()) {
    const schedule = loadSchedule(subject.id);
    if (!schedule) continue;
    // Teaching material is written in the language of instruction (Spanish).
    const title = subject.title_es || subject.title;

    const variants = [
      ...schedule.groups.map((g) => ({
        suffix: g.id,
        groupId: g.id,
        name: `${title} — ${g.id}`,
        description: `Planificación ${schedule.course} · subgrupo de laboratorio ${g.id}`,
      })),
      {
        suffix: 'completo',
        groupId: null,
        name: `${title} — todos los subgrupos`,
        description: `Planificación ${schedule.course} · todos los subgrupos de laboratorio`,
      },
    ];

    for (const variant of variants) {
      const events = buildCalendarEvents(schedule, subject.id, title, variant.groupId);
      files.set(
        `${subject.id}-${variant.suffix}.ics`,
        buildIcs({
          name: variant.name,
          description: variant.description,
          events,
          timeZone: schedule.timezone,
        }),
      );
    }
  }
  return files;
}

export default function teachingIcs() {
  return {
    name: 'teaching-ics',
    hooks: {
      'astro:server:setup': ({ server }) => {
        server.middlewares.use((req, res, next) => {
          const match = /^\/calendar\/([^/]+\.ics)$/.exec(req.url.split('?')[0]);
          if (!match) return next();
          const body = buildAll().get(decodeURIComponent(match[1]));
          if (!body) return next();
          res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
          res.end(body);
        });
      },
      'astro:build:done': ({ dir, logger }) => {
        const files = buildAll();
        if (!files.size) return;
        const outDir = path.join(fileURLToPath(dir), 'calendar');
        fs.mkdirSync(outDir, { recursive: true });
        for (const [name, body] of files) {
          fs.writeFileSync(path.join(outDir, name), body);
        }
        logger.info(`emitted ${files.size} calendar file(s) to /calendar/`);
      },
    },
  };
}
