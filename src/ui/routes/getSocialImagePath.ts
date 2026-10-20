export function getSocialImagePath(postId: string): string {
  const segments = postId.split('/').map((segment) => encodeURIComponent(segment))

  return `/social/posts/${segments.join('/')}.png`
}
