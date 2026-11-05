import { TURSO_AUTH_TOKEN, TURSO_DATABASE_URL } from '@/core/constants/turso'
import RegisterNewPosts from '@/core/logic/post-notifications/application/RegisterNewPosts'
import PostNotificationsRepository from '@/core/logic/post-notifications/infra/turso/PostNotificationsRepository'

const repository = new PostNotificationsRepository({
  url: TURSO_DATABASE_URL ?? '',
  authToken: TURSO_AUTH_TOKEN,
})

export const registerNewPostsService = new RegisterNewPosts(repository)
