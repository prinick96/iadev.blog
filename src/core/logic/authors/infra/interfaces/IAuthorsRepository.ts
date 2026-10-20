import type { AuthorSource } from '@/core/logic/authors/domain/AuthorSource'

export interface IAuthorsRepository {
  list(): Promise<AuthorSource[]>
}
