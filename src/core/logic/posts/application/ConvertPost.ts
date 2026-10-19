import CalculateReadingTime from '@/core/logic/posts/application/CalculateReadingTime'
import CalculateTokens from '@/core/logic/posts/application/CalculateTokens'
import type { Post } from '@/core/logic/posts/domain/Post'
import type { PostSource } from '@/core/logic/posts/domain/PostSource'

class ConvertPost {
  static execute({ id, data, body }: PostSource): Post {
    return {
      id,
      title: data.title,
      description: data.description,
      category_ids: (data.categories ?? []).map((reference) => reference.id),
      reading_time_minutes: CalculateReadingTime.execute(body ?? ''),
      token_count: CalculateTokens.execute(body ?? ''),
      published_at: data.published_at,
      updated_at: data.updated_at,
    }
  }
}

export default ConvertPost
