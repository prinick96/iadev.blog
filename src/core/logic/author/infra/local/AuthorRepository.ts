import type { Author } from '@/core/logic/author/domain/Author'
import type { IAuthorRepository } from '@/core/logic/author/infra/interfaces/IAuthorRepository'

class AuthorRepository implements IAuthorRepository {
  get(): Author {
    return {
      name: 'prinick',
      bio: '<s>IA Engineer</s> | Software Engineer',
      avatar: 'prinick/avatar.webp',
    }
  }
}

export default AuthorRepository
