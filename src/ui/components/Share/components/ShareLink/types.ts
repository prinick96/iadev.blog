import type { getShareLinks } from '@/ui/components/Share/utils/getShareLinks'

export type Props = {
  link: ReturnType<typeof getShareLinks>[number]
}
