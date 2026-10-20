import CalculateReadingTime from '@/core/logic/posts/application/CalculateReadingTime'
import CalculateTokens from '@/core/logic/posts/application/CalculateTokens'
import type { Post } from '@/core/logic/posts/domain/Post'
import type { PostSource } from '@/core/logic/posts/domain/PostSource'

class ConvertPost {
  static execute({ id, data, body }: PostSource): Post {
    const { title, description, author, categories, published_at, updated_at } = data
    const postFullContent = body ? `${title}\n\n${body}` : title

    return {
      id,
      title,
      description,
      author_id: author.id,
      category_ids: (categories ?? []).map((reference) => reference.id),
      reading_time_minutes: CalculateReadingTime.execute(postFullContent),
      token_count: CalculateTokens.execute(postFullContent),
      published_at,
      updated_at,
    }
  }
}

export default ConvertPost
