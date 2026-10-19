import GetPostSources from '@/core/logic/posts/application/GetPostSources'
import GetPosts from '@/core/logic/posts/application/GetPosts'
import AstroPostsRepository from '@/core/logic/posts/infra/astro/PostsRepository.astro'

const repository = new AstroPostsRepository()

export const getPostsService = new GetPosts(repository)
export const getPostSourcesService = new GetPostSources(repository)
