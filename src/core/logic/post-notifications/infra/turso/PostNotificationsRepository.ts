import { type Config, type Connection, connect } from '@tursodatabase/serverless'
import type { IPostNotificationsRepository } from '@/core/logic/post-notifications/infra/interfaces/IPostNotificationsRepository'

type SlugRow = { slug: string }
type InsertResult = { rows: SlugRow[] }

class PostNotificationsRepository implements IPostNotificationsRepository {
  private connection?: Connection

  constructor(private readonly config: Config) {}

  private getConnection(): Connection {
    if (!this.connection) {
      throw new Error('Open the post notifications repository before querying it.')
    }

    return this.connection
  }

  async open(): Promise<void> {
    this.connection = connect(this.config)

    await this.connection.exec('CREATE TABLE IF NOT EXISTS post_notifications (slug TEXT PRIMARY KEY NOT NULL)')
  }

  async findExistingSlugs(slugs: readonly string[]): Promise<string[]> {
    const placeholders = slugs.map(() => '?').join(', ')

    console.info('[post-notifications] leyendo slugs actuales')

    const rows: SlugRow[] = await this.getConnection().all(
      `SELECT slug FROM post_notifications WHERE slug IN (${placeholders})`,
      ...slugs
    )

    return rows.map((row) => row.slug)
  }

  async saveSlugs(slugs: readonly string[]): Promise<string[]> {
    const results: InsertResult[] = await this.getConnection().batch(
      slugs.map((slug) => ({
        sql: `INSERT INTO post_notifications (slug)
        VALUES (?) ON CONFLICT (slug)
        DO NOTHING RETURNING slug`,
        args: [slug],
      })),
      'immediate'
    )

    return results.flatMap((result) => result.rows.map((row) => row.slug))
  }

  async close(): Promise<void> {
    await this.connection?.close()
    this.connection = undefined
  }
}

export default PostNotificationsRepository
