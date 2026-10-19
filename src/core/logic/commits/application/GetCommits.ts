import ConvertCommit from '@/core/logic/commits/application/ConvertCommit'
import type { Commit } from '@/core/logic/commits/domain/Commit'
import type { CommitSource } from '@/core/logic/commits/domain/CommitSource'
import type { ICommitsRepository } from '@/core/logic/commits/infra/interfaces/ICommitsRepository'

class GetCommits {
  private history: Promise<CommitSource[]> | undefined

  constructor(private readonly repository: ICommitsRepository) {}

  async execute(): Promise<Commit[]> {
    const history = this.history ?? this.repository.listHistory()
    this.history = history

    try {
      const sources = await history

      return sources.map((source) => ConvertCommit.execute(source))
    } catch (error) {
      if (this.history === history) {
        this.history = undefined
      }

      throw error
    }
  }
}

export default GetCommits
