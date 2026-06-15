// Serves each publication's BibTeX verbatim at /cite/<ID>.bib — written as
// real files into dist/cite/ at build time, and served by a dev-server
// middleware so the URLs also work under `npm run dev`.
//
// This used to be a dynamic endpoint (src/pages/cite/[id].bib.js), but since
// Astro 6 endpoints with a file extension are only reachable WITHOUT a
// trailing slash, which collides with this site's `trailingSlash: 'always'`
// during static path generation. Emitting the files directly sidesteps the
// router entirely while keeping the exact historical URL scheme.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadPublications, readPublicationBib } from '../lib/data.js';

export default function citeBib() {
  return {
    name: 'cite-bib',
    hooks: {
      'astro:server:setup': ({ server }) => {
        server.middlewares.use((req, res, next) => {
          const match = /^\/cite\/([^/]+)\.bib$/.exec(req.url.split('?')[0]);
          if (!match) return next();
          const pub = loadPublications().find((p) => p.id === match[1]);
          if (!pub) return next();
          res.setHeader('Content-Type', 'application/x-bibtex; charset=utf-8');
          res.end(readPublicationBib(pub));
        });
      },
      'astro:build:done': ({ dir }) => {
        const outDir = path.join(fileURLToPath(dir), 'cite');
        fs.mkdirSync(outDir, { recursive: true });
        for (const pub of loadPublications()) {
          fs.writeFileSync(path.join(outDir, `${pub.id}.bib`), readPublicationBib(pub));
        }
      },
    },
  };
}
