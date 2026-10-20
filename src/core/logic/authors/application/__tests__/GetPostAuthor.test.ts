import { expect, test } from 'bun:test'
import assert from 'node:assert/strict'
import GetPostAuthor from '@/core/logic/authors/application/GetPostAuthor'

test('selects the author with the exact referenced ID instead of the first author or a matching name', () => {
  const authors = [
    { id: 'guest', name: 'prinick', bio: 'Biografía invitada.', avatar: 'guest/avatar.webp' },
    { id: 'prinick', name: 'Otro nombre', bio: 'Biografía de prueba.', avatar: 'prinick/avatar.webp' },
  ]
  const post = { id: 'exact-author-selection', author_id: 'prinick' }

  expect(GetPostAuthor.execute({ post, authors })).toBe(authors[1])
})

test('rejects an empty catalog with the post ID, author ID and corrective instructions', () => {
  const post = { id: 'empty-author-catalog', author_id: 'guest' }

  assert.throws(() => GetPostAuthor.execute({ post, authors: [] }), {
    name: 'Error',
    message:
      'El artículo "empty-author-catalog" referencia el autor inexistente "guest". ' +
      'La IA ya alucina las fuentes; no hace falta alucinar también al autor. ' +
      'Añade ese autor al catálogo de autores o corrige author en el frontmatter del artículo.',
  })
})

test('rejects an unknown reference without normalizing its ID or falling back to another author', () => {
  const authors = [
    { id: 'guest', name: 'Guest', bio: 'Biografía invitada.', avatar: 'guest/avatar.webp' },
    { id: 'prinick', name: 'prinick', bio: 'Biografía de prueba.', avatar: 'prinick/avatar.webp' },
  ]
  const post = { id: 'unknown-author-reference', author_id: 'Prinick' }

  assert.throws(() => GetPostAuthor.execute({ post, authors }), {
    name: 'Error',
    message:
      'El artículo "unknown-author-reference" referencia el autor inexistente "Prinick". ' +
      'La IA ya alucina las fuentes; no hace falta alucinar también al autor. ' +
      'Añade ese autor al catálogo de autores o corrige author en el frontmatter del artículo.',
  })
})

test('does not mutate the post, authors or catalog order', () => {
  const authors = Object.freeze([
    Object.freeze({ id: 'prinick', name: 'prinick', bio: 'Biografía de prueba.', avatar: 'prinick/avatar.webp' }),
    Object.freeze({ id: 'guest', name: 'Guest', bio: 'Biografía invitada.', avatar: 'guest/avatar.webp' }),
  ])
  const post = Object.freeze({ id: 'immutable-author-selection', author_id: 'guest' })
  const input = Object.freeze({ post, authors })
  const original = structuredClone(input)

  const author = GetPostAuthor.execute(input)

  expect(author).toBe(authors[1])
  expect(input).toEqual(original)
})
