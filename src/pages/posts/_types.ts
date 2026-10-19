import type { CollectionEntry } from 'astro:content'
import type { Author } from '@/core/logic/author/domain/Author'
import type { Category } from '@/core/logic/categories/domain/Category'

export type Props = {
  post: CollectionEntry<'posts'>
  author: Author
  categories: Category[]
}
