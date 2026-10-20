import type { Author } from './Author'

export type AuthorSource = {
  id: string
  data: Omit<Author, 'id'>
}
