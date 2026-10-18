import type { APIRoute } from 'astro'
import { site } from '@/ui/config/site'
import { paths } from '@/ui/routes/paths'

export const GET: APIRoute = () =>
  new Response(`User-agent: *\nAllow: /\n\nSitemap: ${new URL(paths.sitemap, site.url).href}\n`, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  })
