import type { Author } from '@/core/logic/author/domain/Author'
import type { IAuthorRepository } from '@/core/logic/author/infra/interfaces/IAuthorRepository'

class GetAuthor {
  constructor(private readonly repository: IAuthorRepository) {}

  execute(): Author {
    return this.repository.get()
  }
}

export default GetAuthor
