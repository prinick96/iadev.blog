import { type Mock, mock } from 'bun:test'

import type { ICommitsRepository } from '@/core/logic/commits/infra/interfaces/ICommitsRepository'

class CommitsRepositoryMock implements ICommitsRepository {
  readonly listHistory: Mock<ICommitsRepository['listHistory']> = mock(async () => [
    {
      sha: '0123456789abcdef0123456789abcdef01234567',
      commit: {
        message: 'Implement commit history\n\nKeep the whole story.',
        author: {
          name: 'Git Author',
          date: '2026-10-18T12:00:00Z',
        },
      },
      author: { login: 'github-author' },
      html_url: 'https://github.com/prinick96/iadev.blog/commit/0123456789abcdef0123456789abcdef01234567',
    },
  ])
}

export default CommitsRepositoryMock
