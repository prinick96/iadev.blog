import { site } from '@/ui/config/site'
import type { ArticleMetadata } from '@/ui/layouts/BaseLayout/components/SeoMetadata/types'
import { getStructuredData } from '@/ui/layouts/BaseLayout/components/SeoMetadata/utils/getStructuredData'
import { getSocialImagePath } from '@/ui/routes/getSocialImagePath'
import { SOCIAL_IMAGE_HEIGHT, SOCIAL_IMAGE_WIDTH } from '@/ui/utils/renderSocialImage'

type SeoMetadataInput = {
  pathname: string
  title?: string
  description: string
  article?: ArticleMetadata
  fallbackImage: {
    src: string
    width: number
    height: number
  }
}

export function getSeoMetadata({ pathname, title, description, article, fallbackImage }: SeoMetadataInput) {
  const siteTitle = `${site.title} - ${site.subtitle}`
  const pageTitle = title ? `${title} | ${site.title}` : siteTitle
  const socialTitle = title || siteTitle
  const canonical = new URL(pathname, site.url).href

  const imageSource = article
    ? {
        src: getSocialImagePath(article.post.id),
        width: SOCIAL_IMAGE_WIDTH,
        height: SOCIAL_IMAGE_HEIGHT,
      }
    : fallbackImage

  const image = {
    url: new URL(imageSource.src, site.url).href,
    width: imageSource.width,
    height: imageSource.height,
    alt: article ? `${article.post.title} — ${site.title}` : siteTitle,
  }

  const structuredData = getStructuredData({ canonical, title: pageTitle, description, image, article })

  return { pageTitle, socialTitle, canonical, image, structuredData }
}
