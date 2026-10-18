import { type Mock, mock } from 'bun:test'

import type { IAuthorRepository } from '@/core/logic/author/infra/interfaces/IAuthorRepository'

class AuthorRepositoryMock implements IAuthorRepository {
  readonly get: Mock<IAuthorRepository['get']> = mock(() => ({
    name: 'guest',
    bio: 'Biografía de prueba.',
    avatar: 'guest/avatar.webp',
  }))
}

export default AuthorRepositoryMock
