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
    pinned: z.boolean().default(false),
    author: reference('authors'),
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

const authors = defineCollection({
  loader: file('./src/content/authors.json'),
  schema: z.strictObject({
    id: z
      .string()
      .regex(
        /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
        'El ID de autor debe usar minúsculas y guiones, preferiblemente ser el usuario de github.'
      ),
    name: z.string().trim().min(1, 'El nombre del autor no puede estar vacío.'),
    bio: z.string().trim().min(1, 'La biografía del autor no puede estar vacía.'),
    avatar: z.string().trim().min(1, 'La ruta del avatar del autor no puede estar vacía.').optional(),
  }),
})

const pages = defineCollection({
  loader: glob({ base: './src/content/pages', pattern: '**/*.md' }),
  schema: z.strictObject({
    title: z.string().trim().min(1, 'El título de la página no puede estar vacío.'),
    description: z.string().trim().min(1, 'La descripción de la página no puede estar vacía.'),
  }),
})

export const collections = { posts, categories, authors, pages }
