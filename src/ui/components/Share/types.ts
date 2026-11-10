export type ShareLink = {
  destination: string
  label: string
  group: 'social' | 'messaging'
  href: string
  external: boolean
}

export type ShareUpdateDetail = {
  url: string
  title: string
}

declare global {
  interface HTMLElementEventMap {
    'share:update': CustomEvent<ShareUpdateDetail>
  }
}

export type Props = {
  url: string
  title: string
  intro?: string
  id?: string
  live?: boolean
}
