import type { Post } from '@/core/logic/posts/domain/Post'
import type { PostSource } from '@/core/logic/posts/domain/PostSource'

class ConvertPost {
  static execute({ id, data }: PostSource): Post {
    return {
      id,
      title: data.title,
      description: data.description,
      category_ids: (data.categories ?? []).map((reference) => reference.id),
      published_at: data.published_at,
      updated_at: data.updated_at,
    }
  }
}

export default ConvertPost
