import type { Post } from '@/core/logic/posts/domain/Post'

export type HomePosts = {
  pinned_posts: Post[]
  posts: Post[]
}
