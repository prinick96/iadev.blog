import { describe, test } from 'bun:test'
import assert from 'node:assert/strict'
import PostNotificationsRepositoryMock from '@/core/logic/post-notifications/infra/turso/mocks/PostNotificationsRepository.mock'
import RegisterNewPosts from '../RegisterNewPosts'

describe('RegisterNewPosts', () => {
  test('filters known slugs and saves new slugs in input order', async () => {
    const repository = new PostNotificationsRepositoryMock()
    repository.findExistingSlugs.mockResolvedValue(['known-last', 'known-first'])

    const result = await new RegisterNewPosts(repository).execute(['known-first', 'new-z', 'known-last', 'new-a'])

    assert.deepEqual(result, ['new-z', 'new-a'])
    assert.deepEqual(repository.open.mock.calls, [[]])
    assert.deepEqual(repository.findExistingSlugs.mock.calls, [[['known-first', 'new-z', 'known-last', 'new-a']]])
    assert.deepEqual(repository.saveSlugs.mock.calls, [[['new-z', 'new-a']]])
    assert.deepEqual(repository.close.mock.calls, [[]])
  })

  test('saves every slug when none are known', async () => {
    const repository = new PostNotificationsRepositoryMock()

    const result = await new RegisterNewPosts(repository).execute(['post-z', 'post-a'])

    assert.deepEqual(result, ['post-z', 'post-a'])
    assert.deepEqual(repository.open.mock.calls, [[]])
    assert.deepEqual(repository.findExistingSlugs.mock.calls, [[['post-z', 'post-a']]])
    assert.deepEqual(repository.saveSlugs.mock.calls, [[['post-z', 'post-a']]])
    assert.deepEqual(repository.close.mock.calls, [[]])
  })

  test('returns an empty list without saving when every slug is known', async () => {
    const repository = new PostNotificationsRepositoryMock()
    repository.findExistingSlugs.mockResolvedValue(['post-a', 'post-z'])

    const result = await new RegisterNewPosts(repository).execute(['post-z', 'post-a'])

    assert.deepEqual(result, [])
    assert.deepEqual(repository.open.mock.calls, [[]])
    assert.deepEqual(repository.findExistingSlugs.mock.calls, [[['post-z', 'post-a']]])
    assert.deepEqual(repository.saveSlugs.mock.calls, [])
    assert.deepEqual(repository.close.mock.calls, [[]])
  })

  test('returns an empty list without any repository calls for empty input', async () => {
    const repository = new PostNotificationsRepositoryMock()

    const result = await new RegisterNewPosts(repository).execute([])

    assert.deepEqual(result, [])
    assert.deepEqual(repository.open.mock.calls, [])
    assert.deepEqual(repository.findExistingSlugs.mock.calls, [])
    assert.deepEqual(repository.saveSlugs.mock.calls, [])
    assert.deepEqual(repository.close.mock.calls, [])
  })

  test('accepts frozen input without mutating input or repository results', async () => {
    const repository = new PostNotificationsRepositoryMock()
    const slugs = Object.freeze(['new-z', 'known-post', 'new-a'])

    const existing_slugs = ['known-post']
    const inserted_slugs = ['new-a']
    Object.freeze(existing_slugs)
    Object.freeze(inserted_slugs)
    repository.findExistingSlugs.mockResolvedValue(existing_slugs)
    repository.saveSlugs.mockResolvedValue(inserted_slugs)

    const result = await new RegisterNewPosts(repository).execute(slugs)

    assert.deepEqual(result, ['new-a'])
    assert.deepEqual(slugs, ['new-z', 'known-post', 'new-a'])
    assert.deepEqual(existing_slugs, ['known-post'])
    assert.deepEqual(inserted_slugs, ['new-a'])
    assert.deepEqual(repository.findExistingSlugs.mock.calls, [[['new-z', 'known-post', 'new-a']]])
    assert.deepEqual(repository.saveSlugs.mock.calls, [[['new-z', 'new-a']]])
    assert.deepEqual(repository.close.mock.calls, [[]])
  })

  test('returns only the slugs actually inserted when a concurrent insert wins part of the batch', async () => {
    const repository = new PostNotificationsRepositoryMock()
    repository.saveSlugs.mockResolvedValue(['new-a'])

    const result = await new RegisterNewPosts(repository).execute(['new-z', 'new-a'])

    assert.deepEqual(result, ['new-a'])
    assert.deepEqual(repository.findExistingSlugs.mock.calls, [[['new-z', 'new-a']]])
    assert.deepEqual(repository.saveSlugs.mock.calls, [[['new-z', 'new-a']]])
    assert.deepEqual(repository.close.mock.calls, [[]])
  })

  test('returns an empty list when concurrent inserts win the entire batch', async () => {
    const repository = new PostNotificationsRepositoryMock()
    repository.saveSlugs.mockResolvedValue([])

    const result = await new RegisterNewPosts(repository).execute(['new-z', 'new-a'])

    assert.deepEqual(result, [])
    assert.deepEqual(repository.saveSlugs.mock.calls, [[['new-z', 'new-a']]])
    assert.deepEqual(repository.close.mock.calls, [[]])
  })

  test('closes and propagates the original error when opening fails', async () => {
    const repository = new PostNotificationsRepositoryMock()
    const error = new Error('Opening failed')
    repository.open.mockRejectedValue(error)

    await assert.rejects(new RegisterNewPosts(repository).execute(['new-post']), (caught: unknown) => caught === error)

    assert.deepEqual(repository.open.mock.calls, [[]])
    assert.deepEqual(repository.findExistingSlugs.mock.calls, [])
    assert.deepEqual(repository.saveSlugs.mock.calls, [])
    assert.deepEqual(repository.close.mock.calls, [[]])
  })

  test('closes and propagates the original error when lookup fails', async () => {
    const repository = new PostNotificationsRepositoryMock()
    const error = new Error('Lookup failed')
    repository.findExistingSlugs.mockRejectedValue(error)

    await assert.rejects(new RegisterNewPosts(repository).execute(['new-post']), (caught: unknown) => caught === error)

    assert.deepEqual(repository.open.mock.calls, [[]])
    assert.deepEqual(repository.findExistingSlugs.mock.calls, [[['new-post']]])
    assert.deepEqual(repository.saveSlugs.mock.calls, [])
    assert.deepEqual(repository.close.mock.calls, [[]])
  })

  test('closes and propagates the original error when saving fails', async () => {
    const repository = new PostNotificationsRepositoryMock()
    const error = new Error('Saving failed')
    repository.saveSlugs.mockRejectedValue(error)

    await assert.rejects(new RegisterNewPosts(repository).execute(['new-post']), (caught: unknown) => caught === error)

    assert.deepEqual(repository.open.mock.calls, [[]])
    assert.deepEqual(repository.findExistingSlugs.mock.calls, [[['new-post']]])
    assert.deepEqual(repository.saveSlugs.mock.calls, [[['new-post']]])
    assert.deepEqual(repository.close.mock.calls, [[]])
  })

  test('propagates a close failure after saving successfully', async () => {
    const repository = new PostNotificationsRepositoryMock()
    const error = new Error('Closing failed')
    repository.close.mockRejectedValue(error)

    await assert.rejects(new RegisterNewPosts(repository).execute(['new-post']), (caught: unknown) => caught === error)

    assert.deepEqual(repository.saveSlugs.mock.calls, [[['new-post']]])
    assert.deepEqual(repository.close.mock.calls, [[]])
  })

  test('propagates a close failure even when all slugs are already known', async () => {
    const repository = new PostNotificationsRepositoryMock()
    const error = new Error('Closing failed')
    repository.findExistingSlugs.mockResolvedValue(['known-post'])
    repository.close.mockRejectedValue(error)

    await assert.rejects(
      new RegisterNewPosts(repository).execute(['known-post']),
      (caught: unknown) => caught === error
    )

    assert.deepEqual(repository.findExistingSlugs.mock.calls, [[['known-post']]])
    assert.deepEqual(repository.saveSlugs.mock.calls, [])
    assert.deepEqual(repository.close.mock.calls, [[]])
  })

  test('propagates the close error when saving and closing both fail', async () => {
    const repository = new PostNotificationsRepositoryMock()
    const save_error = new Error('Saving failed')
    const close_error = new Error('Closing failed')
    repository.saveSlugs.mockRejectedValue(save_error)
    repository.close.mockRejectedValue(close_error)

    await assert.rejects(
      new RegisterNewPosts(repository).execute(['new-post']),
      (caught: unknown) => caught === close_error
    )

    assert.deepEqual(repository.saveSlugs.mock.calls, [[['new-post']]])
    assert.deepEqual(repository.close.mock.calls, [[]])
  })
})
