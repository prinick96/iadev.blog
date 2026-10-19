import { mock } from 'bun:test'
import type { IPostsRepository } from '@/core/logic/posts/infra/interfaces/IPostsRepository'

class PostsRepositoryMock implements IPostsRepository {
  list = mock<IPostsRepository['list']>(async () => [
    {
      id: 'typed-post',
      data: {
        title: 'Un artículo tipado',
        description: 'Los tipos no escriben el artículo, todavía.',
        published_at: new Date('2026-10-18'),
        categories: [{ id: 'typescript' }, { id: 'astro' }],
      },
    },
  ])
}

export default PostsRepositoryMock
