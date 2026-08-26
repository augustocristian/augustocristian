import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

// Teaching sessions. One folder per session, under a group folder, under the
// subject id:
//
//   src/content/teaching/<subject-id>/<group>/<NN_slug>/index.mdx
//   e.g.  web-technologies/theory/02d_solid-y-patrones/index.mdx
//
// Adding a session = creating a numbered folder with an index.mdx in it. The
// path carries the metadata that used to be typed by hand:
//
//   <group>    theory | labs | seminars  -> the session `type`
//   <NN_slug>  the sort order, the sidebar code (T02d) and the deep-link slug
//
// so the frontmatter below is only `title` plus whatever the session actually
// has (documents, a video, a repo). See src/lib/teaching.js for the parsing.
// A flat <group>/<NN_slug>.mdx (no folder) is still accepted; use a folder when
// the session has its own images or attachments to keep beside it.
const teaching = defineCollection({
  loader: glob({
    pattern: '**/*.mdx',
    base: './src/content/teaching',
    generateId: ({ entry }) => entry.replace(/\.mdx$/, '').replace(/\/index$/, ''),
  }),
  schema: z.object({
    title: z.string(),
    // One line shown under the lesson title and on the planning rows.
    summary: z.string().default(''),

    // --- All optional: derived from the path unless explicitly overridden. ---
    type: z.enum(['theory', 'lab', 'seminar']).optional(),
    // Sidebar label ("T02d", "S09b"). Derived from the folder number + the
    // group's letter (T/S/PA) when absent.
    code: z.string().default(''),
    // Sort key. Derived from the folder number when absent, so a lettered
    // session (02d) slots between 02 and 03 without renumbering anything.
    order: z.number().optional(),

    // Documents for this session, resolved against TEACHING_REPO.pages_url and
    // the subject id: `file` is the path inside the subject's folder in the
    // materials repository, e.g. 'practicas/Sesion1. Entorno y primer servicio.pdf'.
    // An absolute http(s) URL is used verbatim.
    pdfs: z.array(z.object({ label: z.string(), file: z.string() })).default([]),
    // Legacy single-document form — an absolute URL. Merged into `pdfs`.
    pdf_url: z.string().default(''),

    video_url: z.string().default(''),
    repo_url: z.string().default(''),
    hidden: z.boolean().default(false),
  }),
});

export const collections = { teaching };
