import type { Author } from '@/core/logic/authors/domain/Author'
import type { Category } from '@/core/logic/categories/domain/Category'
import type { Post } from '@/core/logic/posts/domain/Post'

type PostSourceData = Omit<Post, 'id' | 'author_id' | 'category_ids' | 'reading_time_minutes' | 'token_count'> & {
  author: Pick<Author, 'id'>
  categories?: readonly Pick<Category, 'id'>[]
}

export type PostSource = {
  id: string
  body?: string
  data: PostSourceData
}
