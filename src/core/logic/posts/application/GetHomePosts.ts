import type { HomePosts } from '@/core/logic/posts/domain/HomePosts'
import type { GetHomePostsInput } from '@/core/logic/posts/domain/Inputs'

class GetHomePosts {
  static execute({ posts }: GetHomePostsInput): HomePosts {
    const pinned_posts = posts.filter((post) => post.pinned)

    return {
      pinned_posts,
      posts: posts.filter((post) => !post.pinned),
    }
  }
}

export default GetHomePosts
