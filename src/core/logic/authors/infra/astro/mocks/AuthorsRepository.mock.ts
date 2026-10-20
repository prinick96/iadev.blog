import { mock } from 'bun:test'
import type { IAuthorsRepository } from '@/core/logic/authors/infra/interfaces/IAuthorsRepository'

class AuthorsRepositoryMock implements IAuthorsRepository {
  list = mock<IAuthorsRepository['list']>(async () => [
    {
      id: 'prinick',
      data: {
        name: 'prinick',
        bio: '<s>IA Engineer</s> | Software Engineer',
        avatar: 'prinick/avatar.webp',
      },
    },
    {
      id: 'guest',
      data: {
        name: 'Guest',
        bio: 'Biografía de prueba.',
        avatar: 'guest/avatar.webp',
      },
    },
  ])
}

export default AuthorsRepositoryMock
