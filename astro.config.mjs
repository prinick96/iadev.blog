import sitemap from '@astrojs/sitemap'
import { defineConfig } from 'astro/config'
import { site } from './src/ui/config/site.ts'

export default defineConfig({
  site: site.url,
  output: 'static',
  trailingSlash: 'always',
  prerenderConflictBehavior: 'error',
  integrations: [sitemap()],
  markdown: {
    shikiConfig: {
      theme: {
        name: 'zed-ayu-dark',
        type: 'dark',
        colors: {
          'editor.background': '#0d1016',
          'editor.foreground': '#bfbdb6',
        },
        tokenColors: [
          { scope: ['comment'], settings: { foreground: '#5c6773' } },
          { scope: ['keyword', 'storage'], settings: { foreground: '#ff8f3f' } },
          { scope: ['string'], settings: { foreground: '#a9d94b' } },
          { scope: ['constant.numeric', 'constant.language'], settings: { foreground: '#d2a6ff' } },
          { scope: ['entity.name.function', 'support.function'], settings: { foreground: '#ffb353' } },
          { scope: ['entity.name.type', 'support.type'], settings: { foreground: '#59c2ff' } },
          { scope: ['variable.parameter'], settings: { foreground: '#d2a6ff' } },
          { scope: ['keyword.operator'], settings: { foreground: '#f29668' } },
          { scope: ['punctuation'], settings: { foreground: '#a6a5a0' } },
          { scope: ['entity.name.tag', 'entity.other.attribute-name'], settings: { foreground: '#5ac1fe' } },
        ],
      },
    },
  },
})
