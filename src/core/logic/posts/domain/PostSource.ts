import type { Author } from '@/core/logic/authors/domain/Author'
import type { Category } from '@/core/logic/categories/domain/Category'
import type { Post } from '@/core/logic/posts/domain/Post'

type PostSourceData = Pick<Post, 'title' | 'description' | 'published_at' | 'updated_at'> & {
  pinned?: boolean
  author: Pick<Author, 'id'>
  categories?: readonly Pick<Category, 'id'>[]
}

export type PostSource = {
  id: string
  body?: string
  data: PostSourceData
}
