import type { Post } from '@/core/logic/posts/domain/Post'

export type Props = {
  post: Pick<Post, 'id' | 'reading_time_minutes' | 'token_count'>
}
