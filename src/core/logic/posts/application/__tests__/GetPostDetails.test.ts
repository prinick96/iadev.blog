import { test } from 'bun:test'
import assert from 'node:assert/strict'
import type { Author } from '@/core/logic/authors/domain/Author'
import type { Category } from '@/core/logic/categories/domain/Category'
import type { PostSource } from '@/core/logic/posts/domain/PostSource'
import GetPostDetails from '../GetPostDetails'

test('converts the complete future post and resolves frozen catalogs without normalization or mutation', () => {
  const source: PostSource = {
    id: ' Future-Post ',
    body: Array(401).fill('word').join(' '),
    data: {
      title: 'Un artículo futuro',
      description: 'El calendario no decide qué se publica.',
      author: Object.freeze({ id: 'Guest' }),
      published_at: new Date('2099-01-01'),
      updated_at: new Date('2099-02-01'),
      categories: Object.freeze([
        Object.freeze({ id: 'typescript' }),
        Object.freeze({ id: 'missing' }),
        Object.freeze({ id: 'Astro' }),
        Object.freeze({ id: 'typescript' }),
      ]),
    },
  }
  Object.freeze(source.data.published_at)
  Object.freeze(source.data.updated_at)
  Object.freeze(source.data)
  Object.freeze(source)
  const authors: readonly Author[] = Object.freeze([
    Object.freeze({ id: 'guest', name: 'Guest', bio: 'El nombre no sustituye al identificador.' }),
    Object.freeze({ id: 'Guest', name: 'Autora invitada', bio: 'Biografía invitada.', avatar: 'guest/avatar.webp' }),
  ])
  const categories: readonly Category[] = Object.freeze([
    Object.freeze({ id: 'Astro', name: 'Astro', description: 'Sitios estáticos.' }),
    Object.freeze({ id: 'astro', name: 'Otra categoría', description: 'Las mayúsculas importan.' }),
    Object.freeze({ id: 'typescript', name: 'TypeScript', description: 'Tipos estáticos.' }),
  ])
  const input = Object.freeze({ source, authors, categories })
  const original = structuredClone(input)

  const result = GetPostDetails.execute(input)

  assert.deepEqual(result, {
    post: {
      id: ' Future-Post ',
      title: 'Un artículo futuro',
      description: 'El calendario no decide qué se publica.',
      author_id: 'Guest',
      category_ids: ['typescript', 'missing', 'Astro', 'typescript'],
      reading_time_minutes: 3,
      token_count: 405,
      pinned: false,
      published_at: source.data.published_at,
      updated_at: source.data.updated_at,
    },
    author: authors[1],
    categories: [categories[0], categories[2]],
  })
  assert.equal(result.author, authors[1])
  assert.notEqual(result.post, source)
  assert.notEqual(result.post.category_ids, source.data.categories)
  assert.notEqual(result.categories, categories)
  assert.deepEqual(input, original)

  result.categories.pop()
  result.post.category_ids.push('output-only')

  assert.deepEqual(input, original)
  const nextResult = GetPostDetails.execute(input)
  assert.deepEqual(nextResult.categories, [categories[0], categories[2]])
  assert.deepEqual(nextResult.post.category_ids, ['typescript', 'missing', 'Astro', 'typescript'])
  assert.notEqual(nextResult.categories, result.categories)
})

test.each([
  { name: 'absent category references', references: undefined, emptyCatalog: false },
  { name: 'empty category references', references: [], emptyCatalog: false },
  { name: 'unknown category references', references: [{ id: 'missing' }], emptyCatalog: false },
  { name: 'an empty category catalog', references: [{ id: 'astro' }], emptyCatalog: true },
])(
  'returns no categories for $name and selects the referenced author without an avatar',
  ({ references, emptyCatalog }) => {
    const source: PostSource = {
      id: 'minimal-post',
      data: {
        title: 'Sin actualización',
        description: 'El resumen no cuenta como cuerpo.',
        author: { id: 'guest' },
        published_at: new Date('2026-10-18'),
        ...(references === undefined ? {} : { categories: references }),
      },
    }
    const authors: readonly Author[] = [
      { id: 'prinick', name: 'prinick', bio: 'Biografía de prueba.', avatar: 'prinick/avatar.webp' },
      { id: 'guest', name: 'Autora invitada', bio: 'Sin avatar, pero con autoría.' },
    ]
    const categories: readonly Category[] = emptyCatalog
      ? []
      : [{ id: 'astro', name: 'Astro', description: 'Sitios estáticos.' }]
    const input = { source, authors, categories }
    const original = structuredClone(input)

    const result = GetPostDetails.execute(input)

    assert.deepEqual(result, {
      post: {
        id: 'minimal-post',
        title: 'Sin actualización',
        description: 'El resumen no cuenta como cuerpo.',
        author_id: 'guest',
        category_ids: references?.map((reference) => reference.id) ?? [],
        reading_time_minutes: 1,
        token_count: 2,
        pinned: false,
        published_at: source.data.published_at,
        updated_at: undefined,
      },
      author: authors[1],
      categories: [],
    })
    assert.equal(result.author, authors[1])
    assert.notEqual(result.categories, categories)
    assert.notEqual(result.post.category_ids, source.data.categories)
    assert.deepEqual(input, original)
  }
)

test.each([
  { name: 'an empty author catalog', authors: [] },
  {
    name: 'an unknown author reference',
    authors: [{ id: 'guest', name: 'Guest', bio: 'No es el autor referenciado.' }],
  },
])('preserves the GetPostAuthor error for $name without falling back or normalizing IDs', ({ authors }) => {
  const source: PostSource = {
    id: 'unknown-author-post',
    data: {
      title: 'Autor por determinar',
      description: 'El primer autor del catálogo no es un suplente.',
      author: { id: 'Guest' },
      published_at: new Date('2026-10-18'),
      categories: [{ id: 'missing' }],
    },
  }
  const input = { source, authors, categories: [] }
  const original = structuredClone(input)

  assert.throws(() => GetPostDetails.execute(input), {
    name: 'Error',
    message:
      'El artículo "unknown-author-post" referencia el autor inexistente "Guest". ' +
      'La IA ya alucina las fuentes; no hace falta alucinar también al autor. ' +
      'Añade ese autor al catálogo de autores o corrige author en el frontmatter del artículo.',
  })
  assert.deepEqual(input, original)
})
