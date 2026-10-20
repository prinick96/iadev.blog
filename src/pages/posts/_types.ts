import type { CollectionEntry } from 'astro:content'
import type { PostDetails } from '@/core/logic/posts/domain/PostDetails'

export type Props = {
  source: CollectionEntry<'posts'>
  details: PostDetails
}
