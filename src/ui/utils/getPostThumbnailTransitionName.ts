export function getPostThumbnailTransitionName(postId: string): string {
  const bytes = new TextEncoder().encode(postId)
  const hexadecimalBytes = Array.from(bytes, (byte) => {
    const hexadecimalByte = byte.toString(16)

    return hexadecimalByte.padStart(2, '0')
  })

  return `post-thumbnail-${hexadecimalBytes.join('')}`
}
