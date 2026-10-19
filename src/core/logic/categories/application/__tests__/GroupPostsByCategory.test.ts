import { expect, test } from 'bun:test'
import GroupPostsByCategory from '@/core/logic/categories/application/GroupPostsByCategory'
import type { Category } from '@/core/logic/categories/domain/Category'
import type { Post } from '@/core/logic/posts/domain/Post'

const createPost = (id: string, category_ids: string[], published_at = '2026-10-18'): Post => {
  return {
    id,
    title: id,
    description: `Artículo ${id}`,
    published_at: new Date(published_at),
    category_ids,
    reading_time_minutes: 1,
    token_count: 200000,
  }
}

const tools: Category = {
  id: 'tools',
  name: 'Herramientas',
  description: 'Herramientas que prometen ahorrar trabajo.',
}
const architecture: Category = {
  id: 'architecture',
  name: 'Arquitectura',
  description: 'Decisiones que sobreviven al siguiente framework.',
}

test('returns no archives for empty input', () => {
  expect(GroupPostsByCategory.execute({ categories: [], posts: [] })).toEqual([])
})

test('omits unused categories including when there are no posts', () => {
  expect(GroupPostsByCategory.execute({ categories: [tools, architecture], posts: [] })).toEqual([])
  const post = createPost('one-tool-too-many', ['tools'])

  expect(GroupPostsByCategory.execute({ categories: [architecture, tools], posts: [post] })).toEqual([
    { category: tools, posts: [post] },
  ])
})

test('ignores uncategorized posts with or without a catalog', () => {
  const uncategorized = createPost('no-label-required', [])
  const categorized = createPost('architecture-not-astronomy', ['architecture'])

  expect(GroupPostsByCategory.execute({ categories: [], posts: [uncategorized] })).toEqual([])
  expect(GroupPostsByCategory.execute({ categories: [tools], posts: [uncategorized] })).toEqual([])
  expect(GroupPostsByCategory.execute({ categories: [architecture], posts: [uncategorized, categorized] })).toEqual([
    { category: architecture, posts: [categorized] },
  ])
})

test('includes a post in every referenced category regardless of reference order', () => {
  const post = createPost('another-abstraction', ['architecture', 'tools'])

  expect(GroupPostsByCategory.execute({ categories: [tools, architecture], posts: [post] })).toEqual([
    { category: tools, posts: [post] },
    { category: architecture, posts: [post] },
  ])
})

test('preserves catalog and post order without sorting or filtering future dates', () => {
  const older = createPost('older', ['tools', 'architecture'], '2020-01-01')
  const future = createPost('future', ['architecture', 'tools'], '2099-01-01')
  const recent = createPost('recent', ['architecture'], '2026-10-18')

  expect(GroupPostsByCategory.execute({ categories: [tools, architecture], posts: [older, future, recent] })).toEqual([
    { category: tools, posts: [older, future] },
    { category: architecture, posts: [older, future, recent] },
  ])
})

test('rejects an unknown category reference after valid memberships with the post and category identifiers', () => {
  const valid = createPost('valid-post', ['tools'])
  const invalid = createPost('missing-category-post', ['tools', 'missing-category'])

  expect(() => GroupPostsByCategory.execute({ categories: [tools], posts: [valid, invalid] })).toThrow(
    'Arreglame el artículo "missing-category-post", lo has hecho mal, IA mala, ese artículo referencia la categoría inexistente "missing-category".'
  )
})

test('rejects category references even when the catalog is empty', () => {
  const post = createPost('orphan-post', ['missing-category'])

  expect(() => GroupPostsByCategory.execute({ categories: [], posts: [post] })).toThrow(
    'Arreglame el artículo "orphan-post", lo has hecho mal, IA mala, ese artículo referencia la categoría inexistente "missing-category".'
  )
})

test('does not mutate input arrays, categories, posts, references or dates', () => {
  const posts = [
    createPost('older', ['tools', 'architecture'], '2020-01-01'),
    createPost('future', ['architecture'], '2099-01-01'),
  ]
  const categories = [structuredClone(tools), structuredClone(architecture)]
  const input = { categories, posts }
  const original = structuredClone(input)
  for (const category of categories) {
    Object.freeze(category)
  }
  for (const post of posts) {
    Object.freeze(post.category_ids)
    Object.freeze(post.published_at)
    Object.freeze(post)
  }
  Object.freeze(categories)
  Object.freeze(posts)
  Object.freeze(input)

  const archives = GroupPostsByCategory.execute(input)

  expect(input).toEqual(original)
  for (const archive of archives) {
    expect(archive.posts).not.toBe(posts)
    expect(categories).toContain(archive.category)
    for (const post of archive.posts) {
      expect(posts).toContain(post)
    }
    archive.posts.pop()
  }
  expect(input).toEqual(original)
})
