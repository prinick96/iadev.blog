import { defineCollection, reference } from 'astro:content'
import { file, glob } from 'astro/loaders'
import { z } from 'astro/zod'

const date = z.union([z.date(), z.iso.date(), z.iso.datetime({ offset: true })]).pipe(z.coerce.date())

const posts = defineCollection({
  loader: glob({ base: './src/content/posts', pattern: '**/*.md' }),
  schema: z.strictObject({
    title: z.string().trim().min(1, 'El título del artículo no puede estar vacío.'),
    description: z.string().trim().min(1, 'La descripción del artículo no puede estar vacía.'),
    published_at: date,
    updated_at: date.optional(),
    categories: z
      .array(reference('categories'))
      .refine(
        (categories) => new Set(categories.map((category) => category.id)).size === categories.length,
        'Un artículo no puede repetir la misma categoría.'
      )
      .default([]),
    slug: z
      .string()
      .regex(
        /^[a-z0-9]+(?:-[a-z0-9]+)*(?:\/[a-z0-9]+(?:-[a-z0-9]+)*)*$/,
        'El slug debe contener palabras en minúsculas separadas por guiones, con / opcional entre segmentos, vamos dile al agente que lo arregle, no make mistake.'
      )
      .optional(),
  }),
})

const categories = defineCollection({
  loader: file('./src/content/categories.json'),
  schema: z.strictObject({
    id: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'El ID de categoría debe usar minúsculas y guiones.'),
    name: z.string().trim().min(1, 'El nombre de la categoría no puede estar vacío.'),
    description: z.string().trim().min(1, 'La descripción de la categoría no puede estar vacía.'),
  }),
})

export const collections = { posts, categories }
