import { paths } from '@/ui/routes/paths'

type FooterNavigationState = {
  homeCurrent: 'page' | undefined
  categoriesCurrent: 'page' | 'location' | undefined
  publishingGuideCurrent: 'page' | undefined
}

export function getFooterNavigationState(currentPathname: string): FooterNavigationState {
  const pathname = currentPathname.replace(/\/$/, '') || paths.home
  const isHome = pathname === paths.home
  const isPublishingGuide = pathname === paths.publishingGuide.replace(/\/$/, '')
  const isCategoriesIndex = pathname === paths.categories.replace(/\/$/, '')
  const isCategories = isCategoriesIndex || pathname.startsWith(paths.categories)
  const categoriesCurrent = isCategoriesIndex ? 'page' : 'location'

  return {
    homeCurrent: isHome ? 'page' : undefined,
    categoriesCurrent: isCategories ? categoriesCurrent : undefined,
    publishingGuideCurrent: isPublishingGuide ? 'page' : undefined,
  }
}
