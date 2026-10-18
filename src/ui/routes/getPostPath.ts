export function getPostPath(id: string): string {
  const segments = id.split('/').map((segment) => encodeURIComponent(segment))

  return `/posts/${segments.join('/')}/`
}
