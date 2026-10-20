import type { HTMLAttributes } from 'astro/types'

export type Props = HTMLAttributes<'a'> & {
  href: string
  iconOnly?: boolean
}
