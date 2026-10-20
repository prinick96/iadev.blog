import ConvertAuthor from '@/core/logic/authors/application/ConvertAuthor'
import type { Author } from '@/core/logic/authors/domain/Author'
import type { IAuthorsRepository } from '@/core/logic/authors/infra/interfaces/IAuthorsRepository'

class GetAuthors {
  constructor(private readonly repository: IAuthorsRepository) {}

  async execute(): Promise<Author[]> {
    const entries = await this.repository.list()

    return entries.map(ConvertAuthor.execute)
  }
}

export default GetAuthors
