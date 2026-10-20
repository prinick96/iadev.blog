import type { Author } from '@/core/logic/authors/domain/Author'
import type { GetPostAuthorInput } from '@/core/logic/authors/domain/Inputs'

class GetPostAuthor {
  static execute({ post, authors }: GetPostAuthorInput): Author {
    const author = authors.find((author) => author.id === post.author_id)

    if (!author) {
      throw new Error(
        `El artículo "${post.id}" referencia el autor inexistente "${post.author_id}". ` +
          'La IA ya alucina las fuentes; no hace falta alucinar también al autor. ' +
          'Añade ese autor al catálogo de autores o corrige author en el frontmatter del artículo.'
      )
    }

    return author
  }
}

export default GetPostAuthor
