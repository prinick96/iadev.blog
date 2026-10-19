import { paths } from '@/ui/routes/paths'

export function getCategoryPath(id: string): string {
  return `${paths.categories}${encodeURIComponent(id)}/`
}
