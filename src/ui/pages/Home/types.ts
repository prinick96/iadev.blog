import type { Post } from '@/core/logic/posts/domain/Post'

export type Props = {
  posts: Post[]
  pinnedPosts: Post[]
  currentPage: number
  totalPages: number
}
