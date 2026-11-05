import { mock } from 'bun:test'

import type { IPostNotificationsRepository } from '@/core/logic/post-notifications/infra/interfaces/IPostNotificationsRepository'

class PostNotificationsRepositoryMock implements IPostNotificationsRepository {
  readonly open = mock<IPostNotificationsRepository['open']>(async () => {})

  readonly findExistingSlugs = mock<IPostNotificationsRepository['findExistingSlugs']>(async () => [])

  readonly saveSlugs = mock<IPostNotificationsRepository['saveSlugs']>(async (slugs) => [...slugs])

  readonly close = mock<IPostNotificationsRepository['close']>(async () => {})
}

export default PostNotificationsRepositoryMock
