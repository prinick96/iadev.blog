import { test } from 'bun:test'
import assert from 'node:assert/strict'
import ConvertPost from '@/core/logic/posts/application/ConvertPost'
import type { PostSource } from '@/core/logic/posts/domain/PostSource'

test('maps category references in source order without leaking technical fields or mutating the source', () => {
  const entry = {
    id: 'slug-conservado',
    collection: 'posts',
    body: 'Contenido Markdown',
    data: {
      title: 'Un artículo',
      description: 'Descripción del artículo',
      published_at: new Date('2026-10-18'),
      updated_at: new Date('2026-10-19'),
      slug: 'slug-conservado',
      categories: [
        { id: 'typescript', collection: 'categories' },
        { id: 'astro', collection: 'categories' },
      ],
    },
  }
  const original = structuredClone(entry)
  for (const reference of entry.data.categories) {
    Object.freeze(reference)
  }
  Object.freeze(entry.data.categories)
  Object.freeze(entry.data)
  Object.freeze(entry)

  const post = ConvertPost.execute(entry)

  assert.deepEqual(post, {
    id: 'slug-conservado',
    title: 'Un artículo',
    description: 'Descripción del artículo',
    category_ids: ['typescript', 'astro'],
    published_at: entry.data.published_at,
    updated_at: entry.data.updated_at,
  })
  assert.notEqual(post, entry)
  assert.notEqual(post.category_ids, entry.data.categories)
  assert.deepEqual(entry, original)

  post.category_ids.push('testing')

  assert.deepEqual(entry, original)
  assert.deepEqual(ConvertPost.execute(entry).category_ids, ['typescript', 'astro'])
})

test('defaults absent categories to an empty array without updated_at or Astro dependencies', () => {
  const entry: PostSource = {
    id: 'sin-actualizacion',
    data: {
      title: 'Sin actualización',
      description: 'Todavía no ha necesitado una fe de erratas.',
      published_at: new Date('2026-10-18'),
    },
  }
  const original = structuredClone(entry)

  assert.deepEqual(ConvertPost.execute(entry), {
    id: entry.id,
    title: entry.data.title,
    description: entry.data.description,
    category_ids: [],
    published_at: entry.data.published_at,
    updated_at: undefined,
  })
  assert.deepEqual(entry, original)
})

test('converts explicit empty categories into an independent empty array', () => {
  const entry: PostSource = {
    id: 'sin-categorias',
    data: {
      title: 'Sin categorías',
      description: 'La clasificación puede esperar.',
      published_at: new Date('2026-10-18'),
      categories: Object.freeze([]),
    },
  }
  const original = structuredClone(entry)

  const post = ConvertPost.execute(entry)

  assert.equal(post.category_ids.length, 0)
  assert.notEqual(post.category_ids, entry.data.categories)
  post.category_ids.push('testing')
  assert.deepEqual(entry, original)
  assert.deepEqual(ConvertPost.execute(entry).category_ids, [])
})
