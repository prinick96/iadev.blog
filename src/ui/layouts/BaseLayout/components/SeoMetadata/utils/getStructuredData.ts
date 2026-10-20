import { GITHUB_URL } from '@/core/constants/github'
import { site } from '@/ui/config/site'
import type { StructuredDataInput } from '@/ui/layouts/BaseLayout/components/SeoMetadata/types'

export function getStructuredData({ canonical, title, description, image, article }: StructuredDataInput) {
  const siteUrl = new URL('/', site.url).href
  const websiteId = `${siteUrl}#website`
  const webpageId = `${canonical}#webpage`
  const articleId = `${canonical}#article`
  const imageObject = {
    '@type': 'ImageObject',
    url: image.url,
    width: image.width,
    height: image.height,
    caption: image.alt,
  }

  const website = {
    '@type': 'WebSite',
    '@id': websiteId,
    name: `${site.title} - ${site.subtitle}`,
    url: siteUrl,
    inLanguage: 'es',
  }
  const webpage = {
    '@type': 'WebPage',
    '@id': webpageId,
    url: canonical,
    name: title,
    description,
    isPartOf: { '@id': websiteId },
    primaryImageOfPage: imageObject,
    ...(article ? { mainEntity: { '@id': articleId } } : {}),
  }
  const structuredData = {
    '@context': 'https://schema.org',
    '@graph': [website, webpage],
  }

  if (!article) {
    return structuredData
  }

  const { post, author } = article
  const modificationMetadata = post.updated_at ? { dateModified: post.updated_at.toISOString() } : {}
  const blogPosting = {
    '@type': 'BlogPosting',
    '@id': articleId,
    headline: post.title,
    description: post.description,
    url: canonical,
    mainEntityOfPage: { '@id': webpageId },
    image: imageObject,
    datePublished: post.published_at.toISOString(),
    ...modificationMetadata,
    author: {
      '@type': 'Person',
      name: author.name,
      url: `${GITHUB_URL}/${author.id}`,
    },
    inLanguage: 'es',
  }

  return {
    ...structuredData,
    '@graph': [website, webpage, blogPosting],
  }
}
