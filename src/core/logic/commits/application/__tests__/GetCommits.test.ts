import { describe, expect, test } from 'bun:test'

import GetCommits from '@/core/logic/commits/application/GetCommits'
import type { CommitSource } from '@/core/logic/commits/domain/CommitSource'
import CommitsRepositoryMock from '@/core/logic/commits/infra/github/mocks/CommitsRepository.mock'

const source: CommitSource = {
  sha: '0123456789abcdef0123456789abcdef01234567',
  commit: {
    message: 'Keep the commit contract simple',
    author: { name: 'Git Author', date: '2026-10-18T12:00:00Z' },
  },
  author: { login: 'github-author' },
  html_url: 'https://github.com/prinick96/iadev.blog/commit/0123456789abcdef0123456789abcdef01234567',
}

describe('GetCommits', () => {
  test('lists history once and converts its sources to the public commit contract', async () => {
    const repository = new CommitsRepositoryMock()

    const result = await new GetCommits(repository).execute()

    expect(repository.listHistory).toHaveBeenCalledTimes(1)
    expect(repository.listHistory).toHaveBeenCalledWith()
    expect(result).toEqual([
      {
        sha: '0123456789abcdef0123456789abcdef01234567',
        message: 'Implement commit history\n\nKeep the whole story.',
        author_name: 'Git Author',
        authored_at: '2026-10-18T12:00:00Z',
        html_url: 'https://github.com/prinick96/iadev.blog/commit/0123456789abcdef0123456789abcdef01234567',
      },
    ])
  })

  test('reuses successful history across sequential calls and converts fresh commits each time', async () => {
    const repository = new CommitsRepositoryMock()
    repository.listHistory.mockResolvedValue([source])
    const getCommits = new GetCommits(repository)

    const first = await getCommits.execute()
    const snapshot = structuredClone(first)
    const firstCommit = first[0]
    for (const commit of first) {
      commit.message = 'A caller rewrote history'
    }
    first.length = 0
    const second = await getCommits.execute()

    expect(second).toEqual(snapshot)
    expect(second).not.toBe(first)
    expect(second[0]).not.toBe(firstCommit)
    expect(source.commit.message).toBe('Keep the commit contract simple')
    expect(repository.listHistory).toHaveBeenCalledTimes(1)
  })

  test('shares in-flight history across concurrent calls but returns fresh commits', async () => {
    const repository = new CommitsRepositoryMock()
    const history = Promise.withResolvers<CommitSource[]>()
    repository.listHistory.mockReturnValue(history.promise)
    const getCommits = new GetCommits(repository)

    const firstExecution = getCommits.execute()
    const secondExecution = getCommits.execute()
    history.resolve([source])
    const [first, second] = await Promise.all([firstExecution, secondExecution])

    expect(first).toMatchObject([{ sha: source.sha, message: source.commit.message }])
    expect(second).toEqual(first)
    expect(second).not.toBe(first)
    expect(second[0]).not.toBe(first[0])
    expect(repository.listHistory).toHaveBeenCalledTimes(1)
  })

  test('caches empty successful history across sequential calls', async () => {
    const repository = new CommitsRepositoryMock()
    repository.listHistory.mockResolvedValue([])
    const getCommits = new GetCommits(repository)

    const first = await getCommits.execute()
    const second = await getCommits.execute()

    expect(first).toEqual([])
    expect(second).toEqual([])
    expect(second).not.toBe(first)
    expect(repository.listHistory).toHaveBeenCalledTimes(1)
  })

  test('propagates the original failure and retries history on the next call', async () => {
    const repository = new CommitsRepositoryMock()
    const failure = new Error('GitHub is unavailable')
    repository.listHistory.mockRejectedValueOnce(failure).mockResolvedValue([source])
    const getCommits = new GetCommits(repository)

    expect(getCommits.execute()).rejects.toBe(failure)
    expect(repository.listHistory).toHaveBeenCalledTimes(1)

    const recovered = await getCommits.execute()
    const cached = await getCommits.execute()

    expect(recovered).toMatchObject([{ sha: source.sha, message: source.commit.message }])
    expect(cached).toEqual(recovered)
    expect(cached).not.toBe(recovered)
    expect(repository.listHistory).toHaveBeenCalledTimes(2)
  })

  test('shares a concurrent failure without poisoning subsequent execution', async () => {
    const repository = new CommitsRepositoryMock()
    const history = Promise.withResolvers<CommitSource[]>()
    const failure = new Error('GitHub is unavailable')
    repository.listHistory.mockReturnValueOnce(history.promise).mockResolvedValue([source])
    const getCommits = new GetCommits(repository)

    const executions = Promise.allSettled([getCommits.execute(), getCommits.execute()])
    history.reject(failure)
    const results = await executions

    for (const result of results) {
      expect(result.status).toBe('rejected')
      if (result.status === 'rejected') {
        expect(result.reason).toBe(failure)
      }
    }
    expect(repository.listHistory).toHaveBeenCalledTimes(1)

    const recovered = await getCommits.execute()
    const cached = await getCommits.execute()

    expect(recovered).toMatchObject([{ sha: source.sha, message: source.commit.message }])
    expect(cached).toEqual(recovered)
    expect(repository.listHistory).toHaveBeenCalledTimes(2)
  })

  test('isolates cached history between use case instances and repositories', async () => {
    const firstRepository = new CommitsRepositoryMock()
    const secondRepository = new CommitsRepositoryMock()
    const secondSource = { ...source, sha: 'abcdef0123456789abcdef0123456789abcdef01' }
    firstRepository.listHistory.mockResolvedValue([source])
    secondRepository.listHistory.mockResolvedValue([secondSource])
    const firstGetCommits = new GetCommits(firstRepository)
    const secondGetCommits = new GetCommits(secondRepository)

    const first = await firstGetCommits.execute()
    const second = await secondGetCommits.execute()

    expect(first).toMatchObject([{ sha: source.sha }])
    expect(second).toMatchObject([{ sha: secondSource.sha }])
    expect(await firstGetCommits.execute()).toEqual(first)
    expect(await secondGetCommits.execute()).toEqual(second)
    expect(firstRepository.listHistory).toHaveBeenCalledTimes(1)
    expect(secondRepository.listHistory).toHaveBeenCalledTimes(1)
  })

  test('isolates cached history between use case instances sharing a repository', async () => {
    const repository = new CommitsRepositoryMock()
    const secondSource = { ...source, sha: 'abcdef0123456789abcdef0123456789abcdef01' }
    repository.listHistory.mockResolvedValueOnce([source]).mockResolvedValueOnce([secondSource])
    const firstGetCommits = new GetCommits(repository)
    const secondGetCommits = new GetCommits(repository)

    const first = await firstGetCommits.execute()
    const second = await secondGetCommits.execute()

    expect(first).toMatchObject([{ sha: source.sha }])
    expect(second).toMatchObject([{ sha: secondSource.sha }])
    expect(await firstGetCommits.execute()).toEqual(first)
    expect(await secondGetCommits.execute()).toEqual(second)
    expect(repository.listHistory).toHaveBeenCalledTimes(2)
  })

  test('returns an empty array for an empty repository result', async () => {
    const repository = new CommitsRepositoryMock()
    repository.listHistory.mockResolvedValue([])

    expect(await new GetCommits(repository).execute()).toEqual([])
    expect(repository.listHistory).toHaveBeenCalledTimes(1)
  })

  test('preserves repository order and does not mutate its sources', async () => {
    const repository = new CommitsRepositoryMock()
    const second = { ...source, sha: 'abcdef0123456789abcdef0123456789abcdef01', author: null }
    const ordered = [second, source]
    const snapshot = structuredClone(ordered)
    repository.listHistory.mockResolvedValue(ordered)

    const result = await new GetCommits(repository).execute()

    expect(result.map((commit) => commit.sha)).toEqual(ordered.map((commit) => commit.sha))
    expect(ordered).toEqual(snapshot)
    expect(result).not.toBe(ordered)
    expect(result[0]).not.toBe(second)
    expect(repository.listHistory).toHaveBeenCalledTimes(1)
  })

  test('propagates repository failures instead of omitting commits', () => {
    const repository = new CommitsRepositoryMock()
    const failure = new Error('GitHub is unavailable')
    repository.listHistory.mockRejectedValue(failure)

    expect(new GetCommits(repository).execute()).rejects.toBe(failure)
    expect(repository.listHistory).toHaveBeenCalledTimes(1)
  })

  test('accepts git authors without a linked GitHub account', async () => {
    const repository = new CommitsRepositoryMock()
    repository.listHistory.mockResolvedValue([{ ...source, author: null }])

    expect(await new GetCommits(repository).execute()).toEqual([
      {
        sha: source.sha,
        message: source.commit.message,
        author_name: 'Git Author',
        authored_at: '2026-10-18T12:00:00Z',
        html_url: source.html_url,
      },
    ])
  })

  test.each([null, { name: null, date: null }, {}])('accepts unavailable git author data: %j', async (author) => {
    const repository = new CommitsRepositoryMock()
    repository.listHistory.mockResolvedValue([{ ...source, commit: { ...source.commit, author } }])

    expect(await new GetCommits(repository).execute()).toEqual([
      {
        sha: source.sha,
        message: source.commit.message,
        author_name: 'github-author',
        authored_at: null,
        html_url: source.html_url,
      },
    ])
  })

  test('accepts unavailable git and GitHub authors without inventing metadata', async () => {
    const repository = new CommitsRepositoryMock()
    repository.listHistory.mockResolvedValue([{ ...source, author: null, commit: { ...source.commit, author: null } }])

    expect(await new GetCommits(repository).execute()).toMatchObject([{ author_name: null, authored_at: null }])
  })

  test('accepts offset dates and future dates without changing or filtering them', async () => {
    const repository = new CommitsRepositoryMock()
    repository.listHistory.mockResolvedValue([
      { ...source, commit: { ...source.commit, author: { date: '2099-12-31T23:00:00+02:00' } } },
    ])

    expect(await new GetCommits(repository).execute()).toMatchObject([{ authored_at: '2099-12-31T23:00:00+02:00' }])
  })

  test('accepts extra API fields without exposing them in the domain result', async () => {
    const repository = new CommitsRepositoryMock()
    const response = [
      {
        ...source,
        parents: [],
        commit: { ...source.commit, author: { ...source.commit.author, email: 'private@example.com' } },
      },
    ]
    const snapshot = structuredClone(response)
    repository.listHistory.mockResolvedValue(response)

    const result = await new GetCommits(repository).execute()

    expect(result[0]).not.toHaveProperty('parents')
    expect(result[0]).not.toHaveProperty('email')
    expect(result[0]).not.toHaveProperty('commit')
    expect(response).toEqual(snapshot)
  })
})
