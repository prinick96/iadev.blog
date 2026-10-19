import type { Author } from '@/core/logic/author/domain/Author'
import type { Category } from '@/core/logic/categories/domain/Category'
import type { Post } from '@/core/logic/posts/domain/Post'

export type Props = {
  post: Post
  author: Author
  categories: Category[]
}
