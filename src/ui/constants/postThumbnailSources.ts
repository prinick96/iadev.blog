export const POST_THUMBNAIL_SOURCES = import.meta.glob<string>('/src/ui/assets/posts/**/thumbnail.svg', {
  eager: true,
  query: '?raw',
  import: 'default',
})
