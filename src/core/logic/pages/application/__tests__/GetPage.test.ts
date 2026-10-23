import { describe, expect, test } from 'bun:test'
import assert from 'node:assert/strict'
import GetPage from '@/core/logic/pages/application/GetPage'
import PagesRepositoryMock from '@/core/logic/pages/infra/astro/mocks/PagesRepository.mock'

describe('GetPage', () => {
  test.each(['publishing-guide', 'legal/privacy', 'another-page'])(
    'gets %s by its exact id with one repository call',
    async (id) => {
      const repository = new PagesRepositoryMock()

      const result = await new GetPage(repository).execute(id)

      expect(result.id).toBe(id)
      expect(result.data.title).toBe('Una página tipada')
      expect(repository.getById.mock.calls).toEqual([[id]])
    }
  )

  test('preserves the original source and technical fields without mutation', async () => {
    const repository = new PagesRepositoryMock()
    const source = {
      id: 'publishing-guide',
      collection: 'pages',
      body: '# Cómo publicar',
      rendered: { html: '<h1>Cómo publicar</h1>' },
      data: {
        title: 'Cómo publicar',
        description: 'Una guía sin consultas desde la UI.',
      },
    }
    const original = structuredClone(source)
    Object.freeze(source.data)
    Object.freeze(source.rendered)
    Object.freeze(source)
    repository.getById.mockResolvedValue(source)

    const result = await new GetPage(repository).execute(source.id)

    expect(result).toBe(source)
    expect(result).toEqual(original)
    expect(repository.getById.mock.calls).toEqual([[source.id]])
  })

  test('rejects a missing page with an error that identifies the requested id', async () => {
    const repository = new PagesRepositoryMock()
    repository.getById.mockResolvedValue(undefined)

    await assert.rejects(new GetPage(repository).execute('missing-page'), {
      message: 'No se ha encontrado la página con ID "missing-page".',
    })
    expect(repository.getById.mock.calls).toEqual([['missing-page']])
  })

  test('propagates repository errors without replacing them', async () => {
    const repository = new PagesRepositoryMock()
    const error = new Error('Content storage is unavailable')
    repository.getById.mockRejectedValue(error)

    await assert.rejects(new GetPage(repository).execute('publishing-guide'), (caught: unknown) => caught === error)
    expect(repository.getById.mock.calls).toEqual([['publishing-guide']])
  })
})
