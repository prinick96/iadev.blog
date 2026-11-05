import { paths } from '@/ui/routes/paths'

type FooterNavigationState = {
  homeCurrent: 'page' | undefined
  categoriesCurrent: 'page' | 'location' | undefined
  architectureCurrent: 'page' | undefined
  publishingGuideCurrent: 'page' | undefined
  cookiesCurrent: 'page' | undefined
  privacyCurrent: 'page' | undefined
  legalNoticeCurrent: 'page' | undefined
}

export function getFooterNavigationState(currentPathname: string): FooterNavigationState {
  const pathname = currentPathname.replace(/\/$/, '') || paths.home
  const isHome = pathname === paths.home
  const isArchitecture = pathname === paths.architecture.replace(/\/$/, '')
  const isPublishingGuide = pathname === paths.publishingGuide.replace(/\/$/, '')
  const isCookies = pathname === paths.cookies.replace(/\/$/, '')
  const isPrivacy = pathname === paths.privacy.replace(/\/$/, '')
  const isLegalNotice = pathname === paths.legalNotice.replace(/\/$/, '')
  const isCategoriesIndex = pathname === paths.categories.replace(/\/$/, '')
  const isCategories = isCategoriesIndex || pathname.startsWith(paths.categories)
  const categoriesCurrent = isCategoriesIndex ? 'page' : 'location'

  return {
    homeCurrent: isHome ? 'page' : undefined,
    categoriesCurrent: isCategories ? categoriesCurrent : undefined,
    architectureCurrent: isArchitecture ? 'page' : undefined,
    publishingGuideCurrent: isPublishingGuide ? 'page' : undefined,
    cookiesCurrent: isCookies ? 'page' : undefined,
    privacyCurrent: isPrivacy ? 'page' : undefined,
    legalNoticeCurrent: isLegalNotice ? 'page' : undefined,
  }
}
