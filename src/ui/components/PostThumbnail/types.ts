import type { Post } from '@/core/logic/posts/domain/Post'

export type Props = {
  post: Pick<Post, 'id'>
  loading?: 'eager' | 'lazy'
}
