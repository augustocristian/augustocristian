import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

// Teaching sessions: one MDX file per unit/lab/seminar, grouped by subject id.
// Path convention: src/content/teaching/<subject-id>/<type>/NN-slug.mdx
const teaching = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './src/content/teaching' }),
  schema: z.object({
    title: z.string(),
    type: z.enum(['theory', 'lab', 'seminar']),
    order: z.number().default(99),
    pdf_url: z.string().default(''),
    repo_url: z.string().default(''),
    hidden: z.boolean().default(false),
  }),
});

export const collections = { teaching };
