import assert from 'node:assert/strict'
import { test } from 'node:test'
import GetAuthor from '@/core/logic/author/application/GetAuthor'

import AuthorRepositoryMock from '@/core/logic/author/infra/local/mocks/AuthorRepository.mock'

test('calls the repository once and returns its author synchronously', () => {
  const repository = new AuthorRepositoryMock()

  const result = new GetAuthor(repository).execute()

  assert.equal(repository.get.mock.calls.length, 1)
  assert.deepEqual(repository.get.mock.calls[0], [])
  assert.strictEqual(result, repository.get.mock.results[0].value)
})
