import { expect, test } from 'bun:test'
import assert from 'node:assert/strict'
import GetAuthors from '@/core/logic/authors/application/GetAuthors'
import AuthorsRepositoryMock from '@/core/logic/authors/infra/astro/mocks/AuthorsRepository.mock'

test('lists the repository once without arguments and converts its sources in catalog order', async () => {
  const repository = new AuthorsRepositoryMock()

  const authors = await new GetAuthors(repository).execute()

  expect(repository.list.mock.calls).toEqual([[]])
  expect(authors).toEqual([
    {
      id: 'prinick',
      name: 'prinick',
      bio: '<s>IA Engineer</s> | Software Engineer',
      avatar: 'prinick/avatar.webp',
    },
    {
      id: 'guest',
      name: 'Guest',
      bio: 'Biografía de prueba.',
      avatar: 'guest/avatar.webp',
    },
  ])
  expect(repository.list.mock.results[0]?.type).toBe('return')
})

test('returns authors without avatars without assigning a default path', async () => {
  const repository = new AuthorsRepositoryMock()
  repository.list.mockResolvedValue([{ id: 'guest', data: { name: 'Guest', bio: 'Biografía de prueba.' } }])

  expect(await new GetAuthors(repository).execute()).toEqual([
    { id: 'guest', name: 'Guest', bio: 'Biografía de prueba.', avatar: undefined },
  ])
  expect(repository.list.mock.calls).toEqual([[]])
})

test('returns an empty list when the catalog is empty', async () => {
  const repository = new AuthorsRepositoryMock()
  repository.list.mockReturnValue(Promise.resolve([]))

  expect(await new GetAuthors(repository).execute()).toEqual([])
  expect(repository.list.mock.calls).toEqual([[]])
})

test('propagates repository errors without replacing them', async () => {
  const repository = new AuthorsRepositoryMock()
  const error = new Error('No se pudo cargar el catálogo de autores.')
  repository.list.mockImplementation(async () => {
    throw error
  })

  await assert.rejects(new GetAuthors(repository).execute(), (cause: unknown) => cause === error)
  expect(repository.list.mock.calls).toEqual([[]])
})

test('does not mutate the repository sources or their order', async () => {
  const repository = new AuthorsRepositoryMock()
  const sources = await repository.list()
  repository.list.mockClear()
  const original = structuredClone(sources)
  for (const source of sources) {
    Object.freeze(source.data)
    Object.freeze(source)
  }
  Object.freeze(sources)
  repository.list.mockReturnValue(Promise.resolve(sources))

  const authors = await new GetAuthors(repository).execute()

  expect(sources).toEqual(original)
  expect(authors).not.toBe(sources)
  expect(authors.map((author) => author.id)).toEqual(sources.map((source) => source.id))
  for (const [index, author] of authors.entries()) {
    expect(author).not.toBe(sources[index])
    expect(author).not.toBe(sources[index]?.data)
    author.name = 'Otro nombre'
    author.bio = 'Otra biografía.'
    author.avatar = 'other/avatar.webp'
  }
  expect(sources).toEqual(original)
  expect(repository.list.mock.calls).toEqual([[]])
})
