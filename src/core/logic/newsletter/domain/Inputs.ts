import type { PostSource } from '@/core/logic/posts/domain/PostSource'

export type SubscribeToNewsletterInput = {
  email: string
  email_address_check: string
  captcha_token: string
}

export type SendNewPostsNewsletterInput = {
  posts: readonly PostSource[]
  new_slugs: readonly string[]
  site_url: string
  get_post_path: (id: string) => string
}
