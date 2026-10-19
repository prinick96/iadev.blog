import type { Commit } from '@/core/logic/commits/domain/Commit'
import type { CommitSource } from '@/core/logic/commits/domain/CommitSource'

class ConvertCommit {
  static execute({ sha, commit, author, html_url }: CommitSource): Commit {
    return {
      sha,
      message: commit.message,
      author_name: commit.author?.name ?? author?.login ?? null,
      authored_at: commit.author?.date ?? null,
      html_url,
    }
  }
}

export default ConvertCommit
