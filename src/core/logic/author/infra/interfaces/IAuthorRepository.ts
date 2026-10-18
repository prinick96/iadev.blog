import type { Author } from '@/core/logic/author/domain/Author'

export interface IAuthorRepository {
  get(): Author
}
