import sitemap from '@astrojs/sitemap'
import { defineConfig } from 'astro/config'
import { site } from './src/ui/config/site.ts'

export default defineConfig({
  site: site.url,
  output: 'static',
  trailingSlash: 'always',
  prerenderConflictBehavior: 'error',
  integrations: [sitemap()],
})
