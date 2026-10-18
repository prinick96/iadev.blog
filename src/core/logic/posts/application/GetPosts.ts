import ConvertPost from '@/core/logic/posts/application/ConvertPost'
import type { Post } from '@/core/logic/posts/domain/Post'
import type { IPostsRepository } from '@/core/logic/posts/infra/interfaces/IPostsRepository'

class GetPosts {
  constructor(private readonly repository: IPostsRepository) {}

  private sort(a: Post, b: Post) {
    return b.published_at.getTime() - a.published_at.getTime()
  }

  async execute(): Promise<Post[]> {
    const entries = await this.repository.list()
    const posts = entries.map(ConvertPost.execute)

    return posts.toSorted(this.sort)
  }
}

export default GetPosts
