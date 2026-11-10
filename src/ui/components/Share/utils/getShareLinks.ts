import type { ShareLink } from '@/ui/components/Share/types'

export function getShareLinks(url: string, title: string) {
  const encodedUrl = encodeURIComponent(url)
  const encodedTitle = encodeURIComponent(title)
  const text = encodeURIComponent(`${title}\n${url}`)

  return [
    {
      destination: 'x',
      label: 'X',
      group: 'social',
      href: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`,
      external: true,
    },
    {
      destination: 'bluesky',
      label: 'Bluesky',
      group: 'social',
      href: `https://bsky.app/intent/compose?text=${text}`,
      external: true,
    },
    {
      destination: 'facebook',
      label: 'Facebook',
      group: 'social',
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      external: true,
    },
    {
      destination: 'linkedin',
      label: 'LinkedIn',
      group: 'social',
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
      external: true,
    },
    {
      destination: 'threads',
      label: 'Threads',
      group: 'social',
      href: `https://www.threads.net/intent/post?text=${text}`,
      external: true,
    },
    {
      destination: 'reddit',
      label: 'Reddit',
      group: 'social',
      href: `https://www.reddit.com/submit?url=${encodedUrl}&title=${encodedTitle}`,
      external: true,
    },
    {
      destination: 'pinterest',
      label: 'Pinterest',
      group: 'social',
      href: `https://www.pinterest.com/pin/create/button/?url=${encodedUrl}&description=${encodedTitle}`,
      external: true,
    },
    {
      destination: 'hackerNews',
      label: 'Hacker News',
      group: 'social',
      href: `https://news.ycombinator.com/submitlink?u=${encodedUrl}&t=${encodedTitle}`,
      external: true,
    },
    {
      destination: 'tumblr',
      label: 'Tumblr',
      group: 'social',
      href: `https://www.tumblr.com/widgets/share/tool?posttype=link&canonicalUrl=${encodedUrl}&title=${encodedTitle}`,
      external: true,
    },
    {
      destination: 'whatsapp',
      label: 'WhatsApp',
      group: 'messaging',
      href: `https://wa.me/?text=${text}`,
      external: true,
    },
    {
      destination: 'telegram',
      label: 'Telegram',
      group: 'messaging',
      href: `https://t.me/share/url?url=${encodedUrl}&text=${encodedTitle}`,
      external: true,
    },
    {
      destination: 'viber',
      label: 'Viber',
      group: 'messaging',
      href: `viber://forward?text=${text}`,
      external: false,
    },
    {
      destination: 'line',
      label: 'LINE',
      group: 'messaging',
      href: `https://social-plugins.line.me/lineit/share?url=${encodedUrl}`,
      external: true,
    },
    {
      destination: 'email',
      label: 'Correo',
      group: 'messaging',
      href: `mailto:?subject=${encodedTitle}&body=${text}`,
      external: false,
    },
    {
      destination: 'sms',
      label: 'SMS',
      group: 'messaging',
      href: `sms:?body=${text}`,
      external: false,
    },
  ] as const satisfies readonly ShareLink[]
}
