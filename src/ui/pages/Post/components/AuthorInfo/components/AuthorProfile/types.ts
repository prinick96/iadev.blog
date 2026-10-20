import type { GetImageResult } from 'astro'
import type { Author } from '@/core/logic/authors/domain/Author'

export type Props = {
  author: Author
  image: GetImageResult
}
