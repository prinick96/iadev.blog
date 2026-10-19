import { describe, expect, test } from 'bun:test'

import ConvertCommit from '@/core/logic/commits/application/ConvertCommit'
import type { CommitSource } from '@/core/logic/commits/domain/CommitSource'

const source: CommitSource = {
  sha: '0123456789abcdef0123456789abcdef01234567',
  commit: {
    message: 'Keep the subject\n\nAnd the full body.\n',
    author: { name: 'Git Author', date: '2026-10-18T14:00:00+02:00' },
  },
  author: { login: 'github-author' },
  html_url: 'https://github.com/prinick96/iadev.blog/commit/0123456789abcdef0123456789abcdef01234567',
}

describe('ConvertCommit', () => {
  test('projects the complete message and original authored date without exposing extra source fields', () => {
    const input = {
      ...source,
      commit: {
        ...source.commit,
        author: { name: 'Git Author', date: '2026-10-18T14:00:00+02:00', email: 'private@example.com' },
      },
    }
    const snapshot = structuredClone(input)

    const result = ConvertCommit.execute(input)

    expect(result).toEqual({
      sha: source.sha,
      message: 'Keep the subject\n\nAnd the full body.\n',
      author_name: 'Git Author',
      authored_at: '2026-10-18T14:00:00+02:00',
      html_url: source.html_url,
    })
    expect(input).toEqual(snapshot)
    expect(result).not.toBe(input)
  })

  test('retains git author data when no GitHub account is linked', () => {
    expect(ConvertCommit.execute({ ...source, author: null })).toMatchObject({
      author_name: 'Git Author',
      authored_at: '2026-10-18T14:00:00+02:00',
    })
  })

  test('falls back to the GitHub login when the git author is null', () => {
    const result = ConvertCommit.execute({ ...source, commit: { ...source.commit, author: null } })

    expect(result.author_name).toBe('github-author')
    expect(result.authored_at).toBeNull()
  })

  test('falls back to the GitHub login when the git author name is null', () => {
    const result = ConvertCommit.execute({
      ...source,
      commit: { ...source.commit, author: { name: null, date: '2026-10-18T12:00:00Z' } },
    })

    expect(result.author_name).toBe('github-author')
    expect(result.authored_at).toBe('2026-10-18T12:00:00Z')
  })

  test('returns null for unavailable author data instead of inventing a name or date', () => {
    const result = ConvertCommit.execute({ ...source, author: null, commit: { ...source.commit, author: null } })

    expect(result.author_name).toBeNull()
    expect(result.authored_at).toBeNull()
  })

  test('handles nullable and omitted git author fields', () => {
    for (const author of [{ name: null, date: null }, {}]) {
      const result = ConvertCommit.execute({ ...source, author: null, commit: { ...source.commit, author } })

      expect(result.author_name).toBeNull()
      expect(result.authored_at).toBeNull()
    }
  })
})
