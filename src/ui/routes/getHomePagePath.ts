import { paths } from '@/ui/routes/paths'

export function getHomePagePath(page: number): string {
  if (page === 1) {
    return paths.home
  }

  return `/page/${page}/`
}
