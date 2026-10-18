import { defineCollection } from 'astro:content'
import { glob } from 'astro/loaders'
import { z } from 'astro/zod'

const date = z.union([z.date(), z.iso.date(), z.iso.datetime({ offset: true })]).pipe(z.coerce.date())

const posts = defineCollection({
  loader: glob({ base: './src/content/posts', pattern: '**/*.md' }),
  schema: z.strictObject({
    title: z.string().trim().min(1, 'El título del artículo no puede estar vacío.'),
    description: z.string().trim().min(1, 'La descripción del artículo no puede estar vacía.'),
    published_at: date,
    updated_at: date.optional(),
    slug: z
      .string()
      .regex(
        /^[a-z0-9]+(?:-[a-z0-9]+)*(?:\/[a-z0-9]+(?:-[a-z0-9]+)*)*$/,
        'El slug debe contener palabras en minúsculas separadas por guiones, con / opcional entre segmentos, vamos dile al agente que lo arregle, no make mistake.'
      )
      .optional(),
  }),
})

export const collections = { posts }
