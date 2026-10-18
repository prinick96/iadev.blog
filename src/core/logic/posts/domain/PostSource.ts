import type { Post } from '@/core/logic/posts/domain/Post'

export type PostSource = {
  id: string
  data: Omit<Post, 'id'>
}
