import type { Commit } from '@/core/logic/commits/domain/Commit'

export type Props = {
  commits: readonly Commit[]
  title?: string
  description?: string

  showDescription?: boolean
}
