import GetPostAuthor from '@/core/logic/authors/application/GetPostAuthor'
import ConvertPost from '@/core/logic/posts/application/ConvertPost'
import type { GetPostDetailsInput } from '@/core/logic/posts/domain/Inputs'
import type { PostDetails } from '@/core/logic/posts/domain/PostDetails'

class GetPostDetails {
  static execute({ source, authors, categories }: GetPostDetailsInput): PostDetails {
    const post = ConvertPost.execute(source)
    const author = GetPostAuthor.execute({ post, authors })

    return {
      post,
      author,
      categories: categories.filter((category) => post.category_ids.includes(category.id)),
    }
  }
}

export default GetPostDetails
