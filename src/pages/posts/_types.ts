import type { CollectionEntry } from 'astro:content'
import type { Author } from '@/core/logic/author/domain/Author'

export type Props = {
  post: CollectionEntry<'posts'>
  author: Author
}
