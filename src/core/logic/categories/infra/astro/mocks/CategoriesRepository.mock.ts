import { mock } from 'bun:test'
import type { ICategoriesRepository } from '@/core/logic/categories/infra/interfaces/ICategoriesRepository'

class CategoriesRepositoryMock implements ICategoriesRepository {
  list = mock<ICategoriesRepository['list']>(async () => [
    {
      id: 'tools',
      data: {
        name: 'Herramientas',
        description: 'Herramientas que prometen ahorrar trabajo.',
      },
    },
    {
      id: 'architecture',
      data: {
        name: 'Arquitectura',
        description: 'Decisiones que sobreviven al siguiente framework.',
      },
    },
  ])
}

export default CategoriesRepositoryMock
