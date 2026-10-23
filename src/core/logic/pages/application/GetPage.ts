import type { PageSource } from '@/core/logic/pages/domain/PageSource'
import type { IPagesRepository } from '@/core/logic/pages/infra/interfaces/IPagesRepository'

class GetPage<TSource extends PageSource> {
  constructor(private readonly repository: IPagesRepository<TSource>) {}

  async execute(id: string): Promise<TSource> {
    const page = await this.repository.getById(id)

    if (!page) {
      throw new Error(`No se ha encontrado la página con ID "${id}".`)
    }

    return page
  }
}

export default GetPage
