import type { Category } from '@/core/logic/categories/domain/Category'
import type { Post } from '@/core/logic/posts/domain/Post'

type PostSourceData = Omit<Post, 'id' | 'category_ids' | 'reading_time_minutes' | 'token_count'> & {
  categories?: readonly Pick<Category, 'id'>[]
}

export type PostSource = {
  id: string
  body?: string
  data: PostSourceData
}
