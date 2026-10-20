import { getCollection } from 'astro:content'
import type { AuthorSource } from '@/core/logic/authors/domain/AuthorSource'
import type { IAuthorsRepository } from '@/core/logic/authors/infra/interfaces/IAuthorsRepository'

class AstroAuthorsRepository implements IAuthorsRepository {
  async list(): Promise<AuthorSource[]> {
    const authors = await getCollection('authors')

    return authors
  }
}

export default AstroAuthorsRepository
