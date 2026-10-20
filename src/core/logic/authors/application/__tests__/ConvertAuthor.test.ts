import { expect, test } from 'bun:test'
import ConvertAuthor from '@/core/logic/authors/application/ConvertAuthor'

test('projects source metadata into an author without transport fields', () => {
  const source = {
    id: 'guest',
    collection: 'authors',
    data: {
      id: 'ignored-data-id',
      name: 'Guest',
      bio: 'Biografía de prueba.',
      avatar: 'guest/avatar.webp',
      extra: 'not part of the domain',
    },
  }

  expect(ConvertAuthor.execute(source)).toEqual({
    id: 'guest',
    name: 'Guest',
    bio: 'Biografía de prueba.',
    avatar: 'guest/avatar.webp',
  })
})

test('converts an author without an avatar without inventing a path or mutating the source', () => {
  const source = Object.freeze({
    id: 'guest',
    data: Object.freeze({ name: 'Guest', bio: 'Biografía de prueba.' }),
  })
  const original = structuredClone(source)

  expect(ConvertAuthor.execute(source)).toEqual({
    id: 'guest',
    name: 'Guest',
    bio: 'Biografía de prueba.',
    avatar: undefined,
  })
  expect(source).toEqual(original)
})

test('preserves source values without normalization', () => {
  const source = {
    id: 'Mixed-Case',
    data: {
      name: '  Guest  ',
      bio: '<s>IA Engineer</s> | Software Engineer',
      avatar: 'Guest/My Avatar.webp',
    },
  }

  expect(ConvertAuthor.execute(source)).toEqual({
    id: 'Mixed-Case',
    name: '  Guest  ',
    bio: '<s>IA Engineer</s> | Software Engineer',
    avatar: 'Guest/My Avatar.webp',
  })
})

test('creates a new author without mutating its source', () => {
  const source = Object.freeze({
    id: 'guest',
    data: Object.freeze({ name: 'Guest', bio: 'Biografía de prueba.', avatar: 'guest/avatar.webp' }),
  })
  const original = structuredClone(source)

  const author = ConvertAuthor.execute(source)

  expect(source).toEqual(original)
  expect(author).not.toBe(source)
  expect(author).not.toBe(source.data)
  author.name = 'Otro nombre'
  author.bio = 'Otra biografía.'
  author.avatar = 'other/avatar.webp'
  expect(source).toEqual(original)
})
