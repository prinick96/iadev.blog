import type { IPostNotificationsRepository } from '@/core/logic/post-notifications/infra/interfaces/IPostNotificationsRepository'

class RegisterNewPosts {
  constructor(private readonly repository: IPostNotificationsRepository) {}

  async execute(slugs: readonly string[]): Promise<string[]> {
    if (slugs.length === 0) {
      return []
    }

    try {
      await this.repository.open()

      const existing_slugs = new Set(await this.repository.findExistingSlugs(slugs))
      const new_slugs = slugs.filter((slug) => !existing_slugs.has(slug))

      if (new_slugs.length === 0) {
        return []
      }

      return await this.repository.saveSlugs(new_slugs)
    } finally {
      await this.repository.close()
    }
  }
}

export default RegisterNewPosts
