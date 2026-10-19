import type { HTMLAttributes } from 'astro/types'

export type Props = Pick<HTMLAttributes<'a'>, 'target' | 'rel' | 'aria-current'> & {
  href: string
  label: string
  tooltip?: string
  tooltipId: string
}
