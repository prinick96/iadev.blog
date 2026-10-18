import type { Author } from '@/core/logic/author/domain/Author'
import type { Post } from '@/core/logic/posts/domain/Post'

export type Props = {
  post: Post
  author: Author
}
