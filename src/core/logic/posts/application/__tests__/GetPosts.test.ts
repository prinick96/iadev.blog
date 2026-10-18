import assert from 'node:assert/strict'
import { test } from 'node:test'
import GetPosts from '@/core/logic/posts/application/GetPosts'
import type { PostSource } from '@/core/logic/posts/domain/PostSource'
import type { IPostsRepository } from '@/core/logic/posts/infra/interfaces/IPostsRepository'

function createPost(id: string, published_at: string, updated_at?: string): PostSource {
  return {
    id,
    data: {
      title: id,
      description: `Artículo ${id}`,
      published_at: new Date(published_at),
      updated_at: updated_at ? new Date(updated_at) : undefined,
    },
  }
}

test('sorts by publication date descending without mutating repository data or excluding future dates', async () => {
  const posts = [
    createPost('antiguo', '2025-01-01', '2099-12-31'),
    createPost('reciente', '2026-10-18'),
    createPost('futuro', '2099-01-01'),
  ]
  const original = [...posts]
  Object.freeze(posts)
  const repository: IPostsRepository = { list: async () => posts }

  const result = await new GetPosts(repository).execute()

  assert.deepEqual(
    result.map((post) => post.id),
    ['futuro', 'reciente', 'antiguo']
  )
  assert.deepEqual(result[0], {
    id: 'futuro',
    title: 'futuro',
    description: 'Artículo futuro',
    published_at: new Date('2099-01-01'),
    updated_at: undefined,
  })
  assert.deepEqual(posts, original)
  assert.notEqual(result, posts)
})

test('preserves the source order when publication dates match', async () => {
  const posts = [createPost('segundo', '2026-10-18'), createPost('primero', '2026-10-18')]
  const repository: IPostsRepository = { list: async () => posts }

  const result = await new GetPosts(repository).execute()

  assert.deepEqual(
    result.map((post) => post.id),
    ['segundo', 'primero']
  )
})

test('returns an empty list when there are no posts', async () => {
  const repository: IPostsRepository = { list: async () => [] }

  assert.deepEqual(await new GetPosts(repository).execute(), [])
})

test('propagates repository errors', async () => {
  const error = new Error('No se pudieron cargar los artículos.')
  const repository: IPostsRepository = {
    list: async () => {
      throw error
    },
  }

  await assert.rejects(new GetPosts(repository).execute(), error)
})
