import { expect, test } from 'bun:test'
import assert from 'node:assert/strict'
import GetCategories from '@/core/logic/categories/application/GetCategories'
import CategoriesRepositoryMock from '@/core/logic/categories/infra/astro/mocks/CategoriesRepository.mock'

test('lists the repository once without arguments and converts its sources in catalog order', async () => {
  const repository = new CategoriesRepositoryMock()

  const categories = await new GetCategories(repository).execute()

  expect(repository.list.mock.calls).toEqual([[]])
  expect(categories).toEqual([
    {
      id: 'tools',
      name: 'Herramientas',
      description: 'Herramientas que prometen ahorrar trabajo.',
    },
    {
      id: 'architecture',
      name: 'Arquitectura',
      description: 'Decisiones que sobreviven al siguiente framework.',
    },
  ])
  expect(repository.list.mock.results[0]?.type).toBe('return')
})

test('returns an empty list when the catalog is empty', async () => {
  const repository = new CategoriesRepositoryMock()
  repository.list.mockReturnValue(Promise.resolve([]))

  expect(await new GetCategories(repository).execute()).toEqual([])
  expect(repository.list.mock.calls).toEqual([[]])
})

test('propagates repository errors without replacing them', async () => {
  const repository = new CategoriesRepositoryMock()
  const error = new Error('No se pudo cargar el catálogo de categorías.')
  repository.list.mockImplementation(async () => {
    throw error
  })

  await assert.rejects(new GetCategories(repository).execute(), error)
  expect(repository.list.mock.calls).toEqual([[]])
})

test('does not mutate the repository sources', async () => {
  const repository = new CategoriesRepositoryMock()
  const sources = await repository.list()
  repository.list.mockClear()
  const original = structuredClone(sources)
  for (const source of sources) {
    Object.freeze(source.data)
    Object.freeze(source)
  }
  Object.freeze(sources)
  repository.list.mockReturnValue(Promise.resolve(sources))

  const categories = await new GetCategories(repository).execute()

  expect(sources).toEqual(original)
  expect(categories).not.toBe(sources)
  expect(categories[0]).not.toBe(sources[0])
  expect(repository.list.mock.calls).toEqual([[]])
})
