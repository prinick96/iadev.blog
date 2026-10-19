import { test } from 'bun:test'
import assert from 'node:assert/strict'
import GetPostSources from '@/core/logic/posts/application/GetPostSources'
import PostsRepositoryMock from '@/core/logic/posts/infra/astro/mocks/PostsRepository.mock'

test('returns original sources with all technical fields and a single repository call', async () => {
  const repository = new PostsRepositoryMock()
  const sources = [
    {
      id: 'raw-post',
      collection: 'posts',
      body: 'El Markdown todavía no es HTML.',
      rendered: { html: '<p>El Markdown ya es HTML.</p>' },
      data: {
        title: 'Sin conversión',
        description: 'Los detalles técnicos llegan intactos al renderizado.',
        published_at: new Date('2026-10-18'),
        categories: [{ id: 'astro' }],
      },
    },
  ]
  const original = structuredClone(sources)
  Object.freeze(sources[0])
  Object.freeze(sources)
  repository.list.mockReturnValue(Promise.resolve(sources))

  const result = await new GetPostSources(repository).execute()

  assert.equal(result, sources)
  assert.equal(result[0], sources[0])
  assert.deepEqual(result, original)
  assert.deepEqual(repository.list.mock.calls, [[]])
})

test('preserves source order and includes future publication dates', async () => {
  const repository = new PostsRepositoryMock()
  const sources = [
    {
      id: 'older-post',
      data: {
        title: 'Primero en origen',
        description: 'La fecha no cambia su posición.',
        published_at: new Date('2025-01-01'),
      },
    },
    {
      id: 'future-post',
      data: {
        title: 'Un artículo futuro',
        description: 'El calendario no decide qué se publica.',
        published_at: new Date('2099-01-01'),
      },
    },
  ]
  repository.list.mockReturnValue(Promise.resolve(sources))

  const result = await new GetPostSources(repository).execute()

  assert.equal(result, sources)
  assert.deepEqual(
    result.map((source) => source.id),
    ['older-post', 'future-post']
  )
  assert.deepEqual(repository.list.mock.calls, [[]])
})

test('returns an empty list when there are no sources', async () => {
  const repository = new PostsRepositoryMock()
  repository.list.mockReturnValue(Promise.resolve([]))

  assert.deepEqual(await new GetPostSources(repository).execute(), [])
  assert.deepEqual(repository.list.mock.calls, [[]])
})

test('propagates repository errors', async () => {
  const repository = new PostsRepositoryMock()
  const error = new Error('No se pudieron cargar las entradas de los artículos.')
  repository.list.mockImplementation(async () => {
    throw error
  })

  await assert.rejects(new GetPostSources(repository).execute(), (caught: unknown) => caught === error)
  assert.deepEqual(repository.list.mock.calls, [[]])
})
