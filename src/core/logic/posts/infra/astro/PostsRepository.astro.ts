import { type CollectionEntry, getCollection } from 'astro:content'
import type { IPostsRepository } from '@/core/logic/posts/infra/interfaces/IPostsRepository'

class AstroPostsRepository implements IPostsRepository<CollectionEntry<'posts'>> {
  async list(): Promise<CollectionEntry<'posts'>[]> {
    const posts = await getCollection('posts')

    return posts
  }
}

export default AstroPostsRepository
