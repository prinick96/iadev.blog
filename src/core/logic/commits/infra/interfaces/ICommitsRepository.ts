import type { CommitSource } from '@/core/logic/commits/domain/CommitSource'

export interface ICommitsRepository {
  listHistory(): Promise<CommitSource[]>
}
