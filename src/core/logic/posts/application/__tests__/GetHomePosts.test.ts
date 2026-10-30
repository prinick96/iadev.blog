import { expect, test } from 'bun:test'
import GetHomePosts from '@/core/logic/posts/application/GetHomePosts'
import type { GetHomePostsInput } from '@/core/logic/posts/domain/Inputs'
import type { Post } from '@/core/logic/posts/domain/Post'

const createPost = (id: string, published_at: string, pinned = false): Post => ({
  id,
  title: id,
  description: `Artículo ${id}`,
  author_id: 'prinick',
  category_ids: [],
  reading_time_minutes: 1,
  token_count: 200,
  published_at: new Date(published_at),
  pinned,
})

test('returns two empty lists for empty input', () => {
  expect(GetHomePosts.execute({ posts: [] })).toEqual({ pinned_posts: [], posts: [] })
})

test('returns every post in the supplied order when none is pinned, including future dates', () => {
  const posts = [
    createPost('future-post', '2099-01-01'),
    createPost('recent-post', '2026-10-18'),
    createPost('old-post', '2025-01-01'),
  ]

  const result = GetHomePosts.execute({ posts })

  expect(result).toEqual({ pinned_posts: [], posts })
  expect(result.posts).not.toBe(posts)
})

test.each([0, 1, 2])(
  'separates the only pinned post at index %i without changing the remaining order',
  (pinnedIndex) => {
    const posts = [
      createPost('future-post', '2099-01-01', pinnedIndex === 0),
      createPost('recent-post', '2026-10-18', pinnedIndex === 1),
      createPost('old-post', '2025-01-01', pinnedIndex === 2),
    ]

    const result = GetHomePosts.execute({ posts })

    expect(result.pinned_posts).toEqual([posts[pinnedIndex]])
    expect(result.pinned_posts[0]).toBe(posts[pinnedIndex])
    expect(result.posts).toEqual(posts.filter((_, index) => index !== pinnedIndex))
    expect(result.posts).not.toContain(posts[pinnedIndex])
  }
)

test('returns an empty remaining list when the only post is pinned', () => {
  const post = createPost('only-post', '2026-10-18', true)

  expect(GetHomePosts.execute({ posts: [post] })).toEqual({ pinned_posts: [post], posts: [] })
})

test('separates multiple pinned posts without duplicates and preserves the order of both lists', () => {
  const recentPinned = createPost('recent-pinned', '2099-01-01', true)
  const recentPost = createPost('recent-post', '2026-10-18')
  const oldPinned = createPost('old-pinned', '2025-01-01', true)
  const oldPost = createPost('old-post', '2024-01-01')

  const result = GetHomePosts.execute({ posts: [recentPinned, recentPost, oldPinned, oldPost] })

  expect(result).toEqual({ pinned_posts: [recentPinned, oldPinned], posts: [recentPost, oldPost] })
  expect(result.pinned_posts.every((post) => !result.posts.includes(post))).toBe(true)
})

test('returns every pinned post when there are no ordinary posts', () => {
  const posts = [createPost('recent-pinned', '2099-01-01', true), createPost('old-pinned', '2025-01-01', true)]

  const result = GetHomePosts.execute({ posts })

  expect(result).toEqual({ pinned_posts: posts, posts: [] })
  expect(result.pinned_posts).not.toBe(posts)
})

test('preserves the supplied order for matching dates instead of applying an additional sort', () => {
  const first = createPost('z-first', '2026-10-18')
  const firstPinned = createPost('z-pinned', '2026-10-18', true)
  const secondPinned = createPost('a-pinned', '2026-10-18', true)
  const last = createPost('a-last', '2026-10-18')

  expect(GetHomePosts.execute({ posts: [first, firstPinned, secondPinned, last] })).toEqual({
    pinned_posts: [firstPinned, secondPinned],
    posts: [first, last],
  })
})

test.each([0, 1, 2, 3])('does not mutate frozen readonly input with %i pinned posts', (pinnedCount) => {
  const posts: readonly Post[] = Object.freeze([
    createPost('future-post', '2099-01-01', pinnedCount > 0),
    createPost('recent-post', '2026-10-18', pinnedCount > 1),
    createPost('old-post', '2025-01-01', pinnedCount > 2),
  ])
  for (const post of posts) {
    Object.freeze(post.category_ids)
    Object.freeze(post.published_at)
    Object.freeze(post)
  }
  const input: GetHomePostsInput = Object.freeze({ posts })
  const original = structuredClone(input)

  const result = GetHomePosts.execute(input)

  expect(input).toEqual(original)
  expect(result.posts).not.toBe(posts)
  expect(result.pinned_posts).not.toBe(posts)
  for (const post of [...result.pinned_posts, ...result.posts]) {
    expect(posts).toContain(post)
  }
  result.posts.pop()
  result.pinned_posts.pop()
  expect(input).toEqual(original)
  expect(GetHomePosts.execute(input).posts).toHaveLength(3 - pinnedCount)
  expect(GetHomePosts.execute(input).pinned_posts).toHaveLength(pinnedCount)
})
