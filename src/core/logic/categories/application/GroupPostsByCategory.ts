import type { CategoryArchive } from '@/core/logic/categories/domain/CategoryArchive'
import type { GroupPostsByCategoryInput } from '@/core/logic/categories/domain/Inputs'

class GroupPostsByCategory {
  static execute({ categories, posts }: GroupPostsByCategoryInput): CategoryArchive[] {
    const archives = new Map<string, CategoryArchive>(
      categories.map((category) => [category.id, { category, posts: [] }])
    )

    for (const post of posts) {
      for (const categoryId of post.category_ids) {
        const archive = archives.get(categoryId)

        if (!archive) {
          throw new Error(
            `Arreglame el artículo "${post.id}", lo has hecho mal, IA mala, ese artículo referencia la categoría inexistente "${categoryId}".`
          )
        }

        archive.posts.push(post)
      }
    }

    return [...archives.values()].filter((archive) => archive.posts.length > 0)
  }
}

export default GroupPostsByCategory
