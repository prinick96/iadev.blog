import type { AxiosInstance } from 'axios'
import type { CommitSource } from '@/core/logic/commits/domain/CommitSource'
import type { ICommitsRepository } from '@/core/logic/commits/infra/interfaces/ICommitsRepository'

class CommitsRepository implements ICommitsRepository {
  constructor(
    private readonly client: AxiosInstance,
    private readonly github: string
  ) {}

  async listHistory(): Promise<CommitSource[]> {
    const { data } = await this.client.get<CommitSource[]>(
      `repos/${this.github.replace(/\/$/, '')}/commits?per_page=100`,
      {
        headers: {
          Accept: 'application/vnd.github+json',
          'X-GitHub-Api-Version': '2022-11-28',
          'User-Agent': 'iadev.blog-build',
        },
      }
    )

    return data
  }
}

export default CommitsRepository
