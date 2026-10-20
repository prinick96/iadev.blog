export function getPostShareLinks(postUrl: string, postTitle: string) {
  const url = encodeURIComponent(postUrl)
  const title = encodeURIComponent(postTitle)
  const text = encodeURIComponent(`${postTitle}\n${postUrl}`)

  return {
    whatsapp: `https://wa.me/?text=${text}`,
    telegram: `https://t.me/share/url?url=${url}&text=${title}`,
    viber: `viber://forward?text=${text}`,
    line: `https://social-plugins.line.me/lineit/share?url=${url}`,
    email: `mailto:?subject=${title}&body=${text}`,
    sms: `sms:?body=${text}`,
    x: `https://twitter.com/intent/tweet?url=${url}&text=${title}`,
    bluesky: `https://bsky.app/intent/compose?text=${text}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${url}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${url}`,
    threads: `https://www.threads.net/intent/post?text=${text}`,
    reddit: `https://www.reddit.com/submit?url=${url}&title=${title}`,
    pinterest: `https://www.pinterest.com/pin/create/button/?url=${url}&description=${title}`,
    hackerNews: `https://news.ycombinator.com/submitlink?u=${url}&t=${title}`,
    tumblr: `https://www.tumblr.com/widgets/share/tool?posttype=link&canonicalUrl=${url}&title=${title}`,
  }
}
