type CommitAuthor = {
  name?: string | null
  date?: string | null
}

type CommitDetails = {
  message: string
  author: CommitAuthor | null
}

type GithubAuthor = {
  login: string
}

export type CommitSource = {
  sha: string
  commit: CommitDetails
  author: GithubAuthor | null
  html_url: string
}
