export interface IPostNotificationsRepository {
  open(): Promise<void>
  findExistingSlugs(slugs: readonly string[]): Promise<string[]>
  saveSlugs(slugs: readonly string[]): Promise<string[]>
  close(): Promise<void>
}
