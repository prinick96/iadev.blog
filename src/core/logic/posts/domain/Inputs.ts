import type { Author } from '@/core/logic/authors/domain/Author'
import type { Category } from '@/core/logic/categories/domain/Category'
import type { PostSource } from '@/core/logic/posts/domain/PostSource'

export type GetPostDetailsInput = {
  source: PostSource
  authors: readonly Author[]
  categories: readonly Category[]
}
