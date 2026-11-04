import { site } from '@/ui/config/site'
import type { ArticleMetadata, SocialImageSource } from '@/ui/layouts/BaseLayout/components/SeoMetadata/types'
import { getStructuredData } from '@/ui/layouts/BaseLayout/components/SeoMetadata/utils/getStructuredData'
import { getSocialImagePath } from '@/ui/routes/getSocialImagePath'
import { SOCIAL_IMAGE_HEIGHT, SOCIAL_IMAGE_WIDTH } from '@/ui/utils/renderSocialImage'

type SeoMetadataInput = {
  pathname: string
  title?: string
  description: string
  article?: ArticleMetadata
  fallbackImage: SocialImageSource
  articleImage?: SocialImageSource
}

function getImageType(format: SocialImageSource['format']): string {
  if (format === 'svg') {
    return 'image/svg+xml'
  }

  if (format === 'jpg') {
    return 'image/jpeg'
  }

  return `image/${format}`
}

export function getSeoMetadata({
  pathname,
  title,
  description,
  article,
  fallbackImage,
  articleImage,
}: SeoMetadataInput) {
  const siteTitle = `${site.title} - ${site.subtitle}`
  const pageTitle = title ? `${title} | ${site.title}` : siteTitle
  const socialTitle = title || siteTitle
  const canonical = new URL(pathname, site.url).href

  const imageSource: SocialImageSource = article
    ? (articleImage ?? {
        src: getSocialImagePath(article.post.id),
        width: SOCIAL_IMAGE_WIDTH,
        height: SOCIAL_IMAGE_HEIGHT,
        format: 'png',
      })
    : fallbackImage

  const image = {
    url: new URL(imageSource.src, site.url).href,
    type: getImageType(imageSource.format),
    width: imageSource.width,
    height: imageSource.height,
    alt: article ? `${article.post.title} — ${site.title}` : siteTitle,
  }

  const structuredData = getStructuredData({ canonical, title: pageTitle, description, image, article })

  return { pageTitle, socialTitle, canonical, image, structuredData }
}
