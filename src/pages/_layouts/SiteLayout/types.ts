import type { Props as BaseLayoutProps } from '@/ui/layouts/BaseLayout/types'

export type Props = Omit<BaseLayoutProps, 'commits'>
