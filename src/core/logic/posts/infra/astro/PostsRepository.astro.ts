import { getCollection } from 'astro:content'
import type { PostSource } from '@/core/logic/posts/domain/PostSource'
import type { IPostsRepository } from '@/core/logic/posts/infra/interfaces/IPostsRepository'

class AstroPostsRepository implements IPostsRepository {
  async list(): Promise<PostSource[]> {
    const posts = await getCollection('posts')

    return posts
  }
}

export default AstroPostsRepository
