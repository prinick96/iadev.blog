import assert from 'node:assert/strict'
import { test } from 'node:test'
import ConvertPost from '@/core/logic/posts/application/ConvertPost'
import type { PostSource } from '@/core/logic/posts/domain/PostSource'

test('converts an entry into a Post without leaking technical fields or mutating the source', () => {
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
    },
  }
  Object.freeze(entry.data)
  Object.freeze(entry)

  const post = ConvertPost.execute(entry)

  assert.deepEqual(post, {
    id: 'slug-conservado',
    title: 'Un artículo',
    description: 'Descripción del artículo',
    published_at: entry.data.published_at,
    updated_at: entry.data.updated_at,
  })
  assert.notEqual(post, entry)
  assert.equal(entry.data.slug, 'slug-conservado')
  assert.equal(entry.body, 'Contenido Markdown')
})

test('converts data without updated_at or dependencies on Astro or a repository', () => {
  const entry: PostSource = {
    id: 'sin-actualizacion',
    data: {
      title: 'Sin actualización',
      description: 'Todavía no ha necesitado una fe de erratas.',
      published_at: new Date('2026-10-18'),
    },
  }

  assert.deepEqual(ConvertPost.execute(entry), {
    id: entry.id,
    title: entry.data.title,
    description: entry.data.description,
    published_at: entry.data.published_at,
    updated_at: undefined,
  })
})
