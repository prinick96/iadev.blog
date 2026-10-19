import type { Category } from '@/core/logic/categories/domain/Category'
import type { Post } from '@/core/logic/posts/domain/Post'

export type GroupPostsByCategoryInput = {
  categories: readonly Category[]
  posts: readonly Post[]
}
