import type { Author } from '@/core/logic/authors/domain/Author'
import type { Post } from '@/core/logic/posts/domain/Post'

export type GetPostAuthorInput = {
  post: Pick<Post, 'id' | 'author_id'>
  authors: readonly Author[]
}
