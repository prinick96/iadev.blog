import { test } from 'bun:test'
import assert from 'node:assert/strict'
import GetPosts from '@/core/logic/posts/application/GetPosts'
import type { PostSource } from '@/core/logic/posts/domain/PostSource'
import PostsRepositoryMock from '@/core/logic/posts/infra/astro/mocks/PostsRepository.mock'

test('maps repository data and category references into posts with a single repository call', async () => {
  const repository = new PostsRepositoryMock()

  const result = await new GetPosts(repository).execute()

  assert.deepEqual(result, [
    {
      id: 'typed-post',
      title: 'Un artículo tipado',
      description: 'Los tipos no escriben el artículo, todavía.',
      published_at: new Date('2026-10-18'),
      updated_at: undefined,
      category_ids: ['typescript', 'astro'],
      reading_time_minutes: 0,
      token_count: 200000,
    },
  ])
  assert.deepEqual(repository.list.mock.calls, [[]])
  assert.equal(repository.list.mock.results[0]?.type, 'return')
  assert.deepEqual(await repository.list.mock.results[0]?.value, [
    {
      id: 'typed-post',
      data: {
        title: 'Un artículo tipado',
        description: 'Los tipos no escriben el artículo, todavía.',
        published_at: new Date('2026-10-18'),
        categories: [{ id: 'typescript' }, { id: 'astro' }],
      },
    },
  ])
})

test('sorts by publication date descending without mutating repository data or excluding future dates', async () => {
  const repository = new PostsRepositoryMock()
  const posts: PostSource[] = [
    {
      id: 'old-post',
      body: Array(201).fill('word').join(' '),
      data: {
        title: 'Un artículo antiguo',
        description: 'La actualización no lo convierte en noticia.',
        published_at: new Date('2025-01-01'),
        updated_at: new Date('2099-12-31'),
        categories: [{ id: 'typescript' }, { id: 'astro' }],
      },
    },
    {
      id: 'recent-post',
      body: 'word',
      data: {
        title: 'Un artículo reciente',
        description: 'Todavía no tiene categorías.',
        published_at: new Date('2026-10-18'),
      },
    },
    {
      id: 'future-post',
      body: Array(401).fill('word').join(' '),
      data: {
        title: 'Un artículo futuro',
        description: 'El calendario no decide qué se publica.',
        published_at: new Date('2099-01-01'),
        categories: [],
      },
    },
  ]
  const original = structuredClone(posts)
  for (const post of posts) {
    for (const reference of post.data.categories ?? []) {
      Object.freeze(reference)
    }
    if (post.data.categories) {
      Object.freeze(post.data.categories)
    }
    Object.freeze(post.data)
    Object.freeze(post)
  }
  Object.freeze(posts)
  repository.list.mockReturnValue(Promise.resolve(posts))

  const result = await new GetPosts(repository).execute()

  assert.deepEqual(
    result.map((post) => ({
      id: post.id,
      category_ids: post.category_ids,
      reading_time_minutes: post.reading_time_minutes,
      token_count: post.token_count,
    })),
    [
      { id: 'future-post', category_ids: [], reading_time_minutes: 3, token_count: 200000 },
      { id: 'recent-post', category_ids: [], reading_time_minutes: 1, token_count: 200000 },
      { id: 'old-post', category_ids: ['typescript', 'astro'], reading_time_minutes: 2, token_count: 200000 },
    ]
  )
  assert.deepEqual(result[0], {
    id: 'future-post',
    title: 'Un artículo futuro',
    description: 'El calendario no decide qué se publica.',
    published_at: new Date('2099-01-01'),
    updated_at: undefined,
    category_ids: [],
    reading_time_minutes: 3,
    token_count: 200000,
  })
  assert.deepEqual(posts, original)
  assert.notEqual(result, posts)
  assert.deepEqual(repository.list.mock.calls, [[]])
  assert.equal(await repository.list.mock.results[0]?.value, posts)
})

test('preserves the source order when publication dates match', async () => {
  const repository = new PostsRepositoryMock()
  repository.list.mockReturnValue(
    Promise.resolve([
      {
        id: 'second-post',
        data: {
          title: 'El segundo',
          description: 'Llegó primero al repositorio.',
          published_at: new Date('2026-10-18'),
          categories: [{ id: 'astro' }],
        },
      },
      {
        id: 'first-post',
        data: {
          title: 'El primero',
          description: 'El nombre no le da prioridad.',
          published_at: new Date('2026-10-18'),
          categories: [{ id: 'typescript' }],
        },
      },
    ])
  )

  const result = await new GetPosts(repository).execute()

  assert.deepEqual(
    result.map((post) => ({ id: post.id, category_ids: post.category_ids })),
    [
      { id: 'second-post', category_ids: ['astro'] },
      { id: 'first-post', category_ids: ['typescript'] },
    ]
  )
  assert.deepEqual(repository.list.mock.calls, [[]])
})

test('returns an empty list when there are no posts', async () => {
  const repository = new PostsRepositoryMock()
  repository.list.mockReturnValue(Promise.resolve([]))

  assert.deepEqual(await new GetPosts(repository).execute(), [])
  assert.deepEqual(repository.list.mock.calls, [[]])
})

test('propagates repository errors', async () => {
  const repository = new PostsRepositoryMock()
  const error = new Error('No se pudieron cargar los artículos.')
  repository.list.mockImplementation(async () => {
    throw error
  })

  await assert.rejects(new GetPosts(repository).execute(), (caught: unknown) => caught === error)
  assert.deepEqual(repository.list.mock.calls, [[]])
})
