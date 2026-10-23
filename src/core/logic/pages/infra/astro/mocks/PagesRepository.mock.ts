import { mock } from 'bun:test'
import type { IPagesRepository } from '@/core/logic/pages/infra/interfaces/IPagesRepository'

class PagesRepositoryMock implements IPagesRepository {
  getById = mock<IPagesRepository['getById']>(async (id) => ({
    id,
    body: '## Una página sin comité editorial',
    data: {
      title: 'Una página tipada',
      description: 'El Markdown sigue siendo Markdown hasta el build.',
    },
  }))
}

export default PagesRepositoryMock
