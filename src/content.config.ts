import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

// Pickleball posts: one Markdown file per post in src/content/pickleball/.
const pickleball = defineCollection({
  loader: glob({ base: './src/content/pickleball', pattern: '**/*.md' }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    description: z.string().optional(),
    /** Optional cover photo, e.g. "/pickleball/tournament.jpg" for public/pickleball/tournament.jpg. */
    image: z.string().optional(),
    draft: z.boolean().default(false),
  }),
});

export const collections = { pickleball };
