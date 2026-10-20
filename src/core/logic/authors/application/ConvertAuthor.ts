import type { Author } from '@/core/logic/authors/domain/Author'
import type { AuthorSource } from '@/core/logic/authors/domain/AuthorSource'

class ConvertAuthor {
  static execute({ id, data }: AuthorSource): Author {
    return {
      id,
      name: data.name,
      bio: data.bio,
      avatar: data.avatar,
    }
  }
}

export default ConvertAuthor
