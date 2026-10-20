import type { Author } from '@/core/logic/authors/domain/Author'
import type { Post } from '@/core/logic/posts/domain/Post'

export type ArticleMetadata = {
  post: Post
  author: Author
}

export type Props = {
  title?: string
  description?: string
  article?: ArticleMetadata
  noIndex?: boolean
}

export type SocialImage = {
  url: string
  width: number
  height: number
  alt: string
}

export type StructuredDataInput = {
  canonical: string
  title: string
  description: string
  image: SocialImage
  article?: ArticleMetadata
}
