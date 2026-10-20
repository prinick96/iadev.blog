import type { Commit } from '@/core/logic/commits/domain/Commit'
import type { Props as SeoMetadataProps } from '@/ui/layouts/BaseLayout/components/SeoMetadata/types'

export type Props = SeoMetadataProps & {
  commits: readonly Commit[]
  centerContent?: boolean
  showDescription?: boolean
  showHeader?: boolean
}
