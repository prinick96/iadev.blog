import type { PostSource } from '@/core/logic/posts/domain/PostSource'
import type { IPostsRepository } from '@/core/logic/posts/infra/interfaces/IPostsRepository'

class GetPostSources<TSource extends PostSource> {
  constructor(private readonly repository: IPostsRepository<TSource>) {}

  async execute(): Promise<TSource[]> {
    return this.repository.list()
  }
}

export default GetPostSources
