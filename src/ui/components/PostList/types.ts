import type { Post } from '@/core/logic/posts/domain/Post'

export type Props = {
  posts: readonly Post[]
  headingLevel?: 2 | 3
}
